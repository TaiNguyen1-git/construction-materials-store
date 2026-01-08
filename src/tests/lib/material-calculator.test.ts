import { describe, it, expect } from 'vitest'
import { MaterialCalculatorService } from '@/lib/material-calculator-service'

describe('MaterialCalculatorService', () => {
    describe('parseQuery', () => {
        it('should parse area from "100m2"', () => {
            const result = MaterialCalculatorService.parseQuery('Tính vật liệu xây nhà 100m2')

            expect(result).not.toBeNull()
            expect(result?.area).toBe(100)
        })

        it('should parse area from "100m²"', () => {
            const result = MaterialCalculatorService.parseQuery('xây nhà 150m²')

            expect(result).not.toBeNull()
            expect(result?.area).toBe(150)
        })

        it('should parse floors', () => {
            const result = MaterialCalculatorService.parseQuery('xây nhà 100m2 3 tầng')

            expect(result).not.toBeNull()
            expect(result?.area).toBe(100)
            expect(result?.floors).toBe(3)
        })

        it('should parse dimensions (LxW)', () => {
            const result = MaterialCalculatorService.parseQuery('xây nhà 10x15m')

            expect(result).not.toBeNull()
            expect(result?.length).toBe(10)
            expect(result?.width).toBe(15)
        })

        it('should detect project type: nhà phố', () => {
            const result = MaterialCalculatorService.parseQuery('nhà phố 80m2')

            expect(result?.projectType).toBe('HOUSE')
        })

        it('should detect project type: biệt thự', () => {
            const result = MaterialCalculatorService.parseQuery('biệt thự 200m2')

            expect(result?.projectType).toBe('VILLA')
        })

        it('should detect project type: nhà xưởng', () => {
            const result = MaterialCalculatorService.parseQuery('nhà xưởng 500m2')

            expect(result?.projectType).toBe('WAREHOUSE')
        })

        it('should detect wall type: gạch', () => {
            const result = MaterialCalculatorService.parseQuery('xây nhà gạch 100m2')

            expect(result?.wallType).toBe('BRICK')
        })

        it('should detect wall type: bê tông', () => {
            const result = MaterialCalculatorService.parseQuery('xây nhà bê tông 100m2')

            expect(result?.wallType).toBe('CONCRETE')
        })

        it('should return null if no area/dimensions', () => {
            const result = MaterialCalculatorService.parseQuery('xây nhà')

            expect(result).toBeNull()
        })
    })

    describe('quickCalculate', () => {
        it('should throw error if no area provided', async () => {
            await expect(MaterialCalculatorService.quickCalculate({}))
                .rejects.toThrow('Cần thông tin diện tích')
        })

        it('should throw error for zero area', async () => {
            await expect(MaterialCalculatorService.quickCalculate({ area: 0 }))
                .rejects.toThrow('Cần thông tin diện tích')
        })

        it('should throw error for negative area', async () => {
            await expect(MaterialCalculatorService.quickCalculate({ area: -50 }))
                .rejects.toThrow('Cần thông tin diện tích')
        })

        it('should calculate TILING project correctly', async () => {
            const result = await MaterialCalculatorService.quickCalculate({
                projectType: 'TILING',
                area: 30
            })

            expect(result.materials.length).toBeGreaterThan(0)
            expect(result.totalEstimatedCost).toBeGreaterThan(0)
            expect(result.summary).toContain('lát nền')
            expect(result.summary).toContain('30m²')

            // Should include tiles, cement, sand
            const materialNames = result.materials.map(m => m.material.toLowerCase())
            expect(materialNames.some(m => m.includes('gạch'))).toBe(true)
            expect(materialNames.some(m => m.includes('xi măng'))).toBe(true)
            expect(materialNames.some(m => m.includes('cát'))).toBe(true)
        })

        it('should calculate WALLING project correctly', async () => {
            const result = await MaterialCalculatorService.quickCalculate({
                projectType: 'WALLING',
                area: 20
            })

            expect(result.materials.length).toBeGreaterThan(0)
            expect(result.totalEstimatedCost).toBeGreaterThan(0)
            expect(result.summary).toContain('xây tường')
            expect(result.summary).toContain('20m²')

            // Should include bricks, cement, sand
            const materialNames = result.materials.map(m => m.material.toLowerCase())
            expect(materialNames.some(m => m.includes('gạch'))).toBe(true)
            expect(materialNames.some(m => m.includes('xi măng'))).toBe(true)
        })

        it('should calculate HOUSE project with multiple floors', async () => {
            const result = await MaterialCalculatorService.quickCalculate({
                projectType: 'HOUSE',
                area: 100,
                floors: 2
            })

            expect(result.materials.length).toBeGreaterThan(5) // Many materials for full house
            expect(result.totalEstimatedCost).toBeGreaterThan(0)
            expect(result.summary).toContain('100m²')
            expect(result.summary).toContain('2 tầng')
            expect(result.summary).toContain('200m²') // Total floor area
        })

        it('should include stairs for multi-floor projects', async () => {
            const result = await MaterialCalculatorService.quickCalculate({
                projectType: 'HOUSE',
                area: 80,
                floors: 3
            })

            const materialNames = result.materials.map(m => m.material.toLowerCase())
            expect(materialNames.some(m => m.includes('cầu thang'))).toBe(true)
        })

        it('should not include stairs for single floor', async () => {
            const result = await MaterialCalculatorService.quickCalculate({
                projectType: 'HOUSE',
                area: 80,
                floors: 1
            })

            const materialNames = result.materials.map(m => m.material.toLowerCase())
            expect(materialNames.some(m => m.includes('cầu thang'))).toBe(false)
        })

        it('should adjust for weak soil type', async () => {
            const normalResult = await MaterialCalculatorService.quickCalculate({
                area: 100,
                soilType: 'NORMAL'
            })

            const weakResult = await MaterialCalculatorService.quickCalculate({
                area: 100,
                soilType: 'WEAK'
            })

            // Weak soil should require more foundation materials
            expect(weakResult.totalEstimatedCost).toBeGreaterThan(normalResult.totalEstimatedCost)

            // Should have tip about weak soil
            expect(weakResult.tips.some(t => t.includes('yếu'))).toBe(true)
        })

        it('should calculate area from length x width', async () => {
            const result = await MaterialCalculatorService.quickCalculate({
                length: 10,
                width: 8
            })

            // Should calculate correctly (10 * 8 = 80)
            expect(result.summary).toContain('80m²')
        })
    })

    describe('formatForChat', () => {
        it('should format result with markdown', () => {
            const mockResult = {
                materials: [
                    { material: 'Xi măng', quantity: 10, unit: 'bao', estimatedCost: 950000, category: 'Móng' },
                    { material: 'Cát', quantity: 2, unit: 'm³', estimatedCost: 560000, category: 'Móng' }
                ],
                totalEstimatedCost: 1510000,
                summary: 'Test project 50m²',
                tips: ['Tip 1', 'Tip 2']
            }

            const formatted = MaterialCalculatorService.formatForChat(mockResult)

            expect(formatted).toContain('**KẾT QUẢ TÍNH TOÁN VẬT LIỆU XÂY DỰNG**')
            expect(formatted).toContain('Xi măng')
            expect(formatted).toContain('Cát')
            expect(formatted).toContain('MÓNG')
            expect(formatted).toContain('1.510.000đ') // Total formatted
        })
    })
})
