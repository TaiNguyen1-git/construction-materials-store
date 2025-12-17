/**
 * Report Generator Service
 * Generate PDF and Excel reports for dashboard data
 */

'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ReportData {
    title: string
    subtitle?: string
    generatedAt: Date
    columns: string[]
    rows: (string | number)[][]
    summary?: Record<string, string | number>
}

export class ReportGenerator {
    /**
     * Generate PDF report
     */
    static generatePDF(data: ReportData): Blob {
        const doc = new jsPDF()

        // Title
        doc.setFontSize(18)
        doc.text(data.title, 14, 20)

        // Subtitle
        if (data.subtitle) {
            doc.setFontSize(12)
            doc.setTextColor(100)
            doc.text(data.subtitle, 14, 28)
        }

        // Generated date
        doc.setFontSize(10)
        doc.setTextColor(150)
        doc.text(`Ngày tạo: ${data.generatedAt.toLocaleDateString('vi-VN')}`, 14, 35)

        // Summary section if provided
        let startY = 45
        if (data.summary && Object.keys(data.summary).length > 0) {
            doc.setFontSize(12)
            doc.setTextColor(0)
            doc.text('Tóm tắt:', 14, startY)
            startY += 8

            doc.setFontSize(10)
            Object.entries(data.summary).forEach(([key, value], index) => {
                const yPos = startY + (index * 6)
                doc.text(`• ${key}: ${value}`, 20, yPos)
            })
            startY += Object.keys(data.summary).length * 6 + 10
        }

        // Table
        autoTable(doc, {
            head: [data.columns],
            body: data.rows,
            startY,
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [59, 130, 246], // Blue
                textColor: 255
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            }
        })

        // Footer
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150)
            doc.text(
                `Trang ${i} / ${pageCount} - VLXD Store`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            )
        }

        return doc.output('blob')
    }

    /**
     * Generate Excel report
     */
    static generateExcel(data: ReportData): Blob {
        // Create workbook
        const wb = XLSX.utils.book_new()

        // Create header rows
        const headerRows: any[][] = [
            [data.title],
            [data.subtitle || ''],
            [`Ngày tạo: ${data.generatedAt.toLocaleDateString('vi-VN')}`],
            [] // Empty row
        ]

        // Add summary if provided
        if (data.summary && Object.keys(data.summary).length > 0) {
            headerRows.push(['Tóm tắt:'])
            Object.entries(data.summary).forEach(([key, value]) => {
                headerRows.push([key, value])
            })
            headerRows.push([]) // Empty row
        }

        // Add data table
        const tableData = [data.columns, ...data.rows]
        const allData = [...headerRows, ...tableData]

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(allData)

        // Set column widths
        const colWidths = data.columns.map(() => ({ wch: 15 }))
        ws['!cols'] = colWidths

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo')

        // Generate blob
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        return new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
    }

    /**
     * Download helper
     */
    static download(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    /**
     * Quick export to PDF
     */
    static exportToPDF(data: ReportData, filename?: string) {
        const blob = this.generatePDF(data)
        const name = filename || `${data.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`
        this.download(blob, name)
    }

    /**
     * Quick export to Excel
     */
    static exportToExcel(data: ReportData, filename?: string) {
        const blob = this.generateExcel(data)
        const name = filename || `${data.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`
        this.download(blob, name)
    }
}

export default ReportGenerator
