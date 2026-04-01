'use client'

import { Package, CheckCircle2, AlertCircle } from 'lucide-react'
import ProductModal from './components/ProductModal'
import BulkImportModal from './components/BulkImportModal'
import ProductGrid from './components/ProductGrid'
import ProductList from './components/ProductList'
import ProductHeader from './components/ProductHeader'
import ProductPagination from './components/ProductPagination'
import { useProducts } from './hooks/useProducts'

export default function SupplierProducts() {
    const {
        categories, loading,
        searchQuery, setSearchQuery,
        filterCategory, setFilterCategory,
        filterStatus, setFilterStatus,
        filterStock, setFilterStock,
        currentPage, setCurrentPage,
        viewMode, setViewMode,
        editingId, setEditingId, editData, setEditData,
        isCreating, setIsCreating, createData, setCreateData,
        isUploading,
        message,
        isImporting, setIsImporting, importLog, isProcessingImport,
        handleEdit, handleSave, handleToggleActive, handleDelete,
        handleImageEditUpload, handleFileUpload, handleCreate,
        handleBulkImport, exportToCSV, formatCurrency,
        filteredProducts, paginatedProducts, totalPages
    } = useProducts()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            <ProductHeader 
                viewMode={viewMode}
                setViewMode={setViewMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setCurrentPage={setCurrentPage}
                exportToCSV={exportToCSV}
                setIsImporting={setIsImporting}
                setIsCreating={setIsCreating}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                categories={categories}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterStock={filterStock}
                setFilterStock={setFilterStock}
                filteredCount={filteredProducts.length}
            />

            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-slate-100 ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
                    </div>
                    <p className="font-bold">{message.text}</p>
                </div>
            )}


            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 py-32 flex flex-col items-center justify-center grayscale opacity-50">
                    <Package className="w-20 h-20 mb-6 text-slate-300" />
                    <p className="text-xl font-black uppercase tracking-[0.3em] text-slate-400">Không tìm thấy sản phẩm</p>
                </div>
            ) : viewMode === 'grid' ? (
                <ProductGrid 
                    paginatedProducts={paginatedProducts} 
                    editingId={editingId} 
                    setEditingId={setEditingId} 
                    editData={editData} 
                    setEditData={setEditData} 
                    handleToggleActive={handleToggleActive} 
                    handleEdit={handleEdit} 
                    handleSave={handleSave} 
                    handleDelete={handleDelete} 
                    handleImageEditUpload={handleImageEditUpload} 
                    isUploading={isUploading} 
                    formatCurrency={formatCurrency} 
                />
            ) : (
                <ProductList 
                    paginatedProducts={paginatedProducts} 
                    editingId={editingId} 
                    setEditingId={setEditingId} 
                    editData={editData} 
                    setEditData={setEditData} 
                    handleToggleActive={handleToggleActive} 
                    handleEdit={handleEdit} 
                    handleSave={handleSave} 
                    handleDelete={handleDelete} 
                    handleImageEditUpload={handleImageEditUpload} 
                    isUploading={isUploading} 
                    formatCurrency={formatCurrency} 
                />
            )}

            {filteredProducts.length > 0 && (
                <ProductPagination 
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                    totalItems={filteredProducts.length}
                />
            )}

            {/* Modals extracted to components */}
            <ProductModal 
                isCreating={isCreating} 
                setIsCreating={setIsCreating} 
                createData={createData} 
                setCreateData={setCreateData} 
                categories={categories} 
                handleCreate={handleCreate} 
                handleFileUpload={handleFileUpload} 
                isUploading={isUploading} 
            />
            
            <BulkImportModal 
                isImporting={isImporting} 
                setIsImporting={setIsImporting} 
                isProcessingImport={isProcessingImport} 
                handleBulkImport={handleBulkImport} 
                importLog={importLog} 
            />
        </div>
    )
}
