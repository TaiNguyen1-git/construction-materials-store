/**
 * Script to seed admin data (payroll, reviews, shifts, tasks)
 * Usage: npx tsx scripts/seed-admin-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAdminData() {
  try {
    console.log('🌱 Starting admin data seeding...\n')
    
    // Get existing employees
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })
    
    if (employees.length === 0) {
      console.log('❌ No employees found. Please create employees first.')
      return
    }
    
    console.log(`✅ Found ${employees.length} employees\n`)
    
    // Get existing products
    const products = await prisma.product.findMany({
      take: 5,
      where: { isActive: true }
    })
    
    if (products.length === 0) {
      console.log('❌ No products found. Please create products first.')
      return
    }
    
    console.log(`✅ Found ${products.length} products\n`)
    
    // Get existing customers
    const customers = await prisma.customer.findMany({
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      take: 3
    })
    
    if (customers.length === 0) {
      console.log('❌ No customers found. Please create customers first.')
      return
    }
    
    console.log(`✅ Found ${customers.length} customers\n`)
    
    // 1. Create Payroll Records for last 3 months
    console.log('📋 Creating payroll records...')
    const currentDate = new Date()
    let payrollCount = 0
    
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const payrollDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1)
      const period = `${payrollDate.getFullYear()}-${String(payrollDate.getMonth() + 1).padStart(2, '0')}`
      
      for (const employee of employees) {
        // Check if payroll already exists
        const existing = await prisma.payrollRecord.findUnique({
          where: {
            employeeId_period: {
              employeeId: employee.id,
              period
            }
          }
        })
        
        if (existing) {
          console.log(`  ⏭️  Payroll already exists for ${employee.user.name} - ${period}`)
          continue
        }
        
        // Calculate payroll
        const baseSalary = employee.baseSalary || 10000000
        const workDays = 22
        const hoursWorked = workDays * 8
        const overtimeHours = Math.floor(Math.random() * 20)
        const bonuses = monthOffset === 0 ? Math.floor(Math.random() * 2000000) : Math.floor(Math.random() * 1000000)
        const penalties = Math.floor(Math.random() * 500000)
        const overtimePay = overtimeHours * (baseSalary / 176) * 1.5
        const grossPay = baseSalary + bonuses - penalties + overtimePay
        const taxDeductions = grossPay * 0.1
        const otherDeductions = Math.floor(Math.random() * 300000)
        const netPay = grossPay - taxDeductions - otherDeductions
        
        await prisma.payrollRecord.create({
          data: {
            employeeId: employee.id,
            period,
            baseSalary,
            bonuses,
            penalties,
            overtime: overtimePay,
            totalAdvances: 0,
            grossPay,
            taxDeductions,
            otherDeductions,
            netPay,
            hoursWorked,
            overtimeHours,
            isPaid: monthOffset > 0, // Past months are paid
            paidAt: monthOffset > 0 ? new Date(payrollDate.getFullYear(), payrollDate.getMonth(), 28) : null,
          },
        })
        
        payrollCount++
        console.log(`  ✅ Created payroll for ${employee.user.name} - ${period} - ${netPay.toLocaleString('vi-VN')}đ`)
      }
    }
    
    console.log(`✅ Created ${payrollCount} payroll records\n`)
    
    // 2. Create Product Reviews
    console.log('⭐ Creating product reviews...')
    const reviewTitles = [
      'Sản phẩm chất lượng tốt',
      'Rất hài lòng với sản phẩm',
      'Giao hàng nhanh, đóng gói cẩn thận',
      'Giá cả hợp lý',
      'Sản phẩm đúng như mô tả',
      'Chất lượng vượt mong đợi',
      'Sẽ mua lại lần sau',
      'Đáng giá tiền'
    ]
    
    const reviewContents = [
      'Sản phẩm chất lượng tốt, đúng như mô tả. Giao hàng nhanh, đóng gói cẩn thận. Rất hài lòng!',
      'Tôi rất hài lòng với sản phẩm này. Chất lượng tốt, giá cả hợp lý. Sẽ tiếp tục ủng hộ.',
      'Sản phẩm đúng như mong đợi. Giao hàng nhanh, nhân viên tư vấn nhiệt tình. Cảm ơn shop!',
      'Chất lượng sản phẩm tốt, giá cả phải chăng. Đóng gói cẩn thận, giao hàng đúng hạn.',
      'Sản phẩm chất lượng, đúng mô tả. Nhân viên tư vấn nhiệt tình. Sẽ mua lại.',
      'Rất hài lòng với chất lượng sản phẩm. Giao hàng nhanh, đóng gói kỹ lưỡng.',
      'Sản phẩm tốt, giá cả hợp lý. Dịch vụ chăm sóc khách hàng tốt.',
      'Chất lượng vượt mong đợi. Sẽ giới thiệu cho bạn bè và người thân.'
    ]
    
    let reviewCount = 0
    
    for (let i = 0; i < products.length && i < customers.length; i++) {
      const product = products[i]
      const customer = customers[i]
      
      // Check if review already exists
      const existing = await prisma.productReview.findFirst({
        where: {
          productId: product.id,
          customerId: customer.id
        }
      })
      
      if (existing) {
        console.log(`  ⏭️  Review already exists for ${product.name} by ${customer.user.name}`)
        continue
      }
      
      const rating = Math.floor(Math.random() * 3) + 3 // 3-5 stars
      const titleIndex = Math.floor(Math.random() * reviewTitles.length)
      
      await prisma.productReview.create({
        data: {
          productId: product.id,
          customerId: customer.id,
          rating,
          title: reviewTitles[titleIndex],
          review: reviewContents[titleIndex],
          isVerified: Math.random() > 0.5,
          isPublished: true,
          helpfulCount: Math.floor(Math.random() * 10)
        }
      })
      
      reviewCount++
      console.log(`  ✅ Created review for ${product.name} - ${rating}⭐ by ${customer.user.name}`)
    }
    
    // Create more reviews for variety
    for (let i = 0; i < Math.min(5, products.length); i++) {
      const product = products[i]
      const customer = customers[Math.floor(Math.random() * customers.length)]
      
      const existing = await prisma.productReview.findFirst({
        where: {
          productId: product.id,
          customerId: customer.id
        }
      })
      
      if (!existing) {
        const rating = Math.floor(Math.random() * 3) + 3
        const titleIndex = Math.floor(Math.random() * reviewTitles.length)
        
        await prisma.productReview.create({
          data: {
            productId: product.id,
            customerId: customer.id,
            rating,
            title: reviewTitles[titleIndex],
            review: reviewContents[titleIndex],
            isVerified: Math.random() > 0.5,
            isPublished: true,
            helpfulCount: Math.floor(Math.random() * 10)
          }
        })
        
        reviewCount++
        console.log(`  ✅ Created review for ${product.name} - ${rating}⭐ by ${customer.user.name}`)
      }
    }
    
    console.log(`✅ Created ${reviewCount} product reviews\n`)
    
    // 3. Create Work Shifts for employees
    console.log('🕐 Creating work shifts...')
    let shiftCount = 0
    const today = new Date()
    
    // Create shifts for the last 30 days and next 7 days
    for (let dayOffset = -30; dayOffset <= 7; dayOffset++) {
      const shiftDate = new Date(today)
      shiftDate.setDate(today.getDate() + dayOffset)
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (shiftDate.getDay() === 0 || shiftDate.getDay() === 6) {
        continue
      }
      
      for (const employee of employees) {
        // Check if shift already exists
        const dateStart = new Date(shiftDate)
        dateStart.setHours(0, 0, 0, 0)
        const dateEnd = new Date(shiftDate)
        dateEnd.setHours(23, 59, 59, 999)
        
        const existing = await prisma.workShift.findFirst({
          where: {
            employeeId: employee.id,
            date: {
              gte: dateStart,
              lte: dateEnd
            }
          }
        })
        
        if (existing) {
          continue
        }
        
        // Create shift - use valid enum values from schema
        // ShiftType: REGULAR, OVERTIME, LOADING, TRANSPORT
        // ShiftStatus: SCHEDULED, IN_PROGRESS, COMPLETED, ABSENT, CANCELLED
        const shiftTypes: ('REGULAR' | 'OVERTIME' | 'LOADING' | 'TRANSPORT')[] = ['REGULAR', 'REGULAR', 'OVERTIME', 'LOADING']
        const statuses: ('SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'CANCELLED')[] = 
          dayOffset < 0 ? ['COMPLETED', 'COMPLETED', 'COMPLETED', 'ABSENT'] : ['SCHEDULED']
        const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        
        // Set start/end time based on shift type
        let startTime = '08:00'
        let endTime = '17:00'
        if (shiftType === 'OVERTIME') {
          startTime = '18:00'
          endTime = '22:00'
        } else if (shiftType === 'LOADING') {
          startTime = '06:00'
          endTime = '14:00'
        } else if (shiftType === 'TRANSPORT') {
          startTime = '07:00'
          endTime = '15:00'
        } else {
          // REGULAR
          startTime = '08:00'
          endTime = '17:00'
        }
        // Fix date manipulation - create new date objects
        const shiftDateCopy = new Date(shiftDate)
        const clockInDate = dayOffset < 0 && status === 'COMPLETED' 
          ? new Date(shiftDateCopy.setHours(8, Math.floor(Math.random() * 30), 0, 0))
          : null
        
        const shiftDateCopy2 = new Date(shiftDate)
        // Calculate end hour based on shift type
        const endHour = shiftType === 'OVERTIME' ? 22 : 
                       shiftType === 'LOADING' ? 14 : 
                       shiftType === 'TRANSPORT' ? 15 : 17
        const clockOutDate = dayOffset < 0 && status === 'COMPLETED' 
          ? new Date(shiftDateCopy2.setHours(endHour, Math.floor(Math.random() * 30), 0, 0))
          : null
        
        await prisma.workShift.create({
          data: {
            employeeId: employee.id,
            date: new Date(shiftDate), // Create new date object
            startTime,
            endTime,
            shiftType,
            status,
            clockIn: clockInDate,
            clockOut: clockOutDate,
            breakTime: shiftType === 'REGULAR' ? 60 : (shiftType === 'OVERTIME' ? 0 : 30), // Break time
            overtime: status === 'COMPLETED' && Math.random() > 0.7 ? Math.floor(Math.random() * 60) : 0, // Random overtime
          }
        })
        
        shiftCount++
      }
    }
    
    console.log(`✅ Created ${shiftCount} work shifts\n`)
    
    // 4. Create Employee Tasks
    console.log('✅ Creating employee tasks...')
    const taskTitles = [
      'Kiểm tra tồn kho',
      'Nhập hàng mới',
      'Xử lý đơn hàng',
      'Chăm sóc khách hàng',
      'Báo cáo doanh thu',
      'Kiểm tra chất lượng sản phẩm',
      'Cập nhật danh mục sản phẩm',
      'Xử lý khiếu nại',
      'Chuẩn bị báo cáo tuần',
      'Kiểm tra hệ thống'
    ]
    
    const taskDescriptions = [
      'Kiểm tra số lượng tồn kho và cập nhật hệ thống',
      'Nhập hàng mới từ nhà cung cấp và cập nhật giá',
      'Xử lý các đơn hàng đang chờ và cập nhật trạng thái',
      'Trả lời câu hỏi và hỗ trợ khách hàng',
      'Tổng hợp và phân tích doanh thu tháng này',
      'Kiểm tra chất lượng sản phẩm trước khi bán',
      'Cập nhật thông tin và hình ảnh sản phẩm',
      'Xử lý các khiếu nại từ khách hàng',
      'Chuẩn bị báo cáo tuần cho ban lãnh đạo',
      'Kiểm tra và bảo trì hệ thống'
    ]
    
    let taskCount = 0
    
    for (const employee of employees) {
      // Create 5-10 tasks per employee
      const numTasks = Math.floor(Math.random() * 6) + 5
      
      for (let i = 0; i < numTasks; i++) {
        const titleIndex = Math.floor(Math.random() * taskTitles.length)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30))
        
        const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
        const status = statuses[Math.floor(Math.random() * statuses.length)] as any
        const priorities = ['LOW', 'MEDIUM', 'HIGH']
        const priority = priorities[Math.floor(Math.random() * priorities.length)] as any
        
        const completedAt = status === 'COMPLETED' 
          ? new Date(dueDate.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000)
          : null
        
        await prisma.employeeTask.create({
          data: {
            employeeId: employee.id,
            title: taskTitles[titleIndex],
            description: taskDescriptions[titleIndex],
            taskType: 'GENERAL',
            status,
            priority,
            dueDate,
            completedAt,
            estimatedHours: Math.floor(Math.random() * 8) + 1,
            actualHours: status === 'COMPLETED' ? Math.floor(Math.random() * 8) + 1 : null,
          }
        })
        
        taskCount++
      }
    }
    
    console.log(`✅ Created ${taskCount} employee tasks\n`)
    
    console.log('🎉 Admin data seeding completed!')
    console.log('\n📊 Summary:')
    console.log(`   - ${payrollCount} payroll records`)
    console.log(`   - ${reviewCount} product reviews`)
    console.log(`   - ${shiftCount} work shifts`)
    console.log(`   - ${taskCount} employee tasks`)
    console.log('\n✅ All admin pages should now have data!')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdminData()

