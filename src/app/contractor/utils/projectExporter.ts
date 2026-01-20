import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportProjectLogToPDF = (project: any, reports: any[], materialRequests: any[]) => {
    const doc = new jsPDF()
    const primaryColor: [number, number, number] = [26, 115, 232] // Blue

    // Title
    doc.setFontSize(22)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('NHAT KY CONG TRINH', 105, 20, { align: 'center' })

    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text(project.title, 105, 30, { align: 'center' })

    // Project Info
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Dia chi: ${project.location || 'N/A'}`, 14, 45)
    doc.text(`Khách hàng: ${project.customer?.user?.name || project.contactName}`, 14, 52)
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 14, 59)

    // 1. Materials List
    doc.setFontSize(14)
    doc.text('1. DANH SACH VAT TU', 14, 75)

    const materialData = project.projectMaterials?.map((m: any) => [
        m.product?.name,
        m.quantity,
        m.product?.unit,
        m.status === 'DELIVERED' ? 'Da giao' : 'Dang cho'
    ]) || []

    autoTable(doc, {
        startY: 80,
        head: [['Ten vat tu', 'So luong', 'Don vi', 'Trang thai']],
        body: materialData,
        headStyles: { fillColor: primaryColor }
    })

    // 2. Worker Reports
    const nextY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.text('2. BAO CAO HIEN TRUONG', 14, nextY)

    const reportData = reports.map((r: any) => [
        new Date(r.createdAt).toLocaleDateString('vi-VN'),
        r.workerName,
        r.notes || 'Khong co ghi chu',
        r.status === 'APPROVED' ? 'Da xac nhan' : 'Dang cho'
    ])

    autoTable(doc, {
        startY: nextY + 5,
        head: [['Ngay', 'Tho', 'Noi dung', 'Trang thai']],
        body: reportData,
        headStyles: { fillColor: primaryColor }
    })

    // 3. Special Requests
    const lastY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.text('3. YEU CAU VAT TU TU HIEN TRUONG', 14, lastY)

    const requestData = materialRequests.map((r: any) => [
        new Date(r.createdAt).toLocaleDateString('vi-VN'),
        r.workerName,
        r.items.map((i: any) => `${i.name} (${i.quantity})`).join(', '),
        r.status
    ])

    autoTable(doc, {
        startY: lastY + 5,
        head: [['Ngay', 'Nguoi yeu cau', 'Vat tu', 'Trang thai']],
        body: requestData,
        headStyles: { fillColor: [255, 140, 0] as [number, number, number] } // Orange for requests
    })

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Trang ${i} / ${pageCount} - Phat trien boi SmartBuild`, 105, 290, { align: 'center' })
    }

    doc.save(`${project.title.replace(/\s+/g, '_')}_Log.pdf`)
}
