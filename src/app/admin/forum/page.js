'use client';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminForumDashboard;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
var date_fns_1 = require("date-fns");
var locale_1 = require("date-fns/locale");
function AdminForumDashboard() {
    var _this = this;
    var _a, _b;
    var _c = (0, react_1.useState)([]), discussions = _c[0], setDiscussions = _c[1];
    var _d = (0, react_1.useState)([]), stats = _d[0], setStats = _d[1];
    var _e = (0, react_1.useState)(true), loading = _e[0], setLoading = _e[1];
    var _f = (0, react_1.useState)('ALL'), statusFilter = _f[0], setStatusFilter = _f[1]; // ALL, APPROVED, PENDING_REVIEW, REJECTED, SPAM
    var _g = (0, react_1.useState)(''), keyword = _g[0], setKeyword = _g[1];
    var fetchQueue = function () { return __awaiter(_this, void 0, void 0, function () {
        var token, url, res, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    token = localStorage.getItem('access_token');
                    url = new URL('/api/admin/forum', window.location.origin);
                    url.searchParams.set('status', statusFilter);
                    if (keyword)
                        url.searchParams.set('keyword', keyword);
                    return [4 /*yield*/, fetch(url.toString(), {
                            headers: { 'Authorization': "Bearer ".concat(token) }
                        })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    if (data.success) {
                        setDiscussions(data.data);
                        setStats(data.stats);
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    react_hot_toast_1.default.error('Lỗi khi tải hàng đợi kiểm duyệt!');
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        fetchQueue();
    }, [statusFilter]);
    var handleAction = function (id, action) { return __awaiter(_this, void 0, void 0, function () {
        var confirmMsg, token, toastId, res, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    confirmMsg = action === 'DELETE' ? 'Xóa vĩnh viễn bài này?' :
                        action === 'APPROVED' ? 'Duyệt bài này hiện lên Web?' :
                            'Khóa/Từ chối bài này?';
                    if (!confirm(confirmMsg))
                        return [2 /*return*/];
                    token = localStorage.getItem('access_token');
                    toastId = react_hot_toast_1.default.loading('Đang xử lý...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch('/api/admin/forum', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer ".concat(token) },
                            body: JSON.stringify({ discussionId: id, action: action })
                        })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    if (data.success) {
                        react_hot_toast_1.default.success('Xử lý thành công!', { id: toastId });
                        fetchQueue(); // Tải lại bảng
                    }
                    else {
                        react_hot_toast_1.default.error(data.error || 'Có lỗi xảy ra', { id: toastId });
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    react_hot_toast_1.default.error('Lỗi server', { id: toastId });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var pendingCount = ((_a = stats.find(function (s) { return s.status === 'PENDING_REVIEW'; })) === null || _a === void 0 ? void 0 : _a._count) || 0;
    var approvedCount = ((_b = stats.find(function (s) { return s.status === 'APPROVED'; })) === null || _b === void 0 ? void 0 : _b._count) || 0;
    return (<div className="space-y-6">
            <react_hot_toast_1.Toaster position="top-right"/>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản Lý & Kiểm Duyệt Diễn Đàn</h1>
                    <p className="text-gray-500 mt-1">Lưới giám sát 3-Lớp: Kiểm duyệt Lọc AI và Tố Cáo từ Cộng đồng.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <lucide_react_1.AlertTriangle className="w-6 h-6"/>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Cần Duyệt Gấp</p>
                            <h3 className="text-2xl font-black text-gray-900">{pendingCount} <span className="text-sm font-normal text-gray-400">bài bị Cờ báo cáo</span></h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <lucide_react_1.ShieldCheck className="w-6 h-6"/>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500">An Toàn Trên Web</p>
                            <h3 className="text-2xl font-black text-gray-900">{approvedCount} <span className="text-sm font-normal text-gray-400">chủ đề sạch</span></h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={function () { return setStatusFilter('ALL'); }} className={"px-4 py-2 text-sm font-semibold rounded-md transition-all ".concat(statusFilter === 'ALL' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900')}>Tất Cả</button>
                    <button onClick={function () { return setStatusFilter('PENDING_REVIEW'); }} className={"px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1 ".concat(statusFilter === 'PENDING_REVIEW' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-900')}>
                        {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-orange-500"></span>} Cần Duyệt Chờ Lệnh
                    </button>
                    <button onClick={function () { return setStatusFilter('APPROVED'); }} className={"px-4 py-2 text-sm font-semibold rounded-md transition-all ".concat(statusFilter === 'APPROVED' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-900')}>Đã Duyệt Đăng</button>
                    <button onClick={function () { return setStatusFilter('SPAM'); }} className={"px-4 py-2 text-sm font-semibold rounded-md transition-all ".concat(statusFilter === 'SPAM' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-900')}>Danh Sách Thùng Rác</button>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                        <input type="text" placeholder="Tìm vi phạm từ khóa..." value={keyword} onChange={function (e) { return setKeyword(e.target.value); }} onKeyDown={function (e) { return e.key === 'Enter' && fetchQueue(); }} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"/>
                    </div>
                </div>
            </div>

            {/* Data Grid / Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-sm font-bold text-gray-700">Chủ Đề & Nội Dung</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-700">Tác Giả</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-700 w-48">Trạng Thái (AI Lọc)</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-700 text-right w-40">Hành Động Nhánh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (<tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        <div className="animate-pulse w-8 h-8 md:mx-auto border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                                        <p className="mt-2 text-sm font-semibold">Đang truy vấn Dữ liệu Cảnh Khuyển...</p>
                                    </td>
                                </tr>) : discussions.length === 0 ? (<tr>
                                    <td colSpan={4} className="px-6 py-10 flex flex-col items-center text-center text-gray-500 border-b-0 w-full min-w-full">
                                        <lucide_react_1.ShieldCheck className="w-12 h-12 text-gray-200 mb-3"/>
                                        <p className="text-gray-900 font-bold mb-1">Cộng đồng đang sạch sẽ!</p>
                                        <p className="text-sm text-gray-400">Không tìm thấy yêu cầu cần xét duyệt nào trong hàng đợi.</p>
                                    </td>
                                </tr>) : discussions.map(function (doc) {
            var _a, _b, _c, _d;
            return (<tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 align-top">
                                        <div className="max-w-md">
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                {(_a = doc.category) === null || _a === void 0 ? void 0 : _a.name} 
                                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                                    {(0, date_fns_1.format)(new Date(doc.createdAt), 'dd MMMM yyyy HH:mm', { locale: locale_1.vi })}
                                                </span>
                                            </div>
                                            <a href={"/forum/discussion/".concat(doc.id)} target="_blank" className="font-bold text-gray-900 mb-1 block hover:text-blue-600">
                                                {doc.title}
                                            </a>
                                            <p className="text-sm text-gray-500 line-clamp-2">{doc.content}</p>
                                            
                                            {/* AI Flag / Reports Warning */}
                                            {(doc.systemFlag || doc.reportCount > 0) && (<div className="mt-3 flex items-start gap-2 bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-100">
                                                    <lucide_react_1.Flag className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                                                    <div className="text-xs font-medium">
                                                        {doc.systemFlag && <span className="block font-bold mb-0.5">Cảnh báo máy học: {doc.systemFlag}</span>}
                                                        {doc.reportCount > 0 && <span className="block">Bị cộng đồng Báo cáo {doc.reportCount} lần.</span>}
                                                    </div>
                                                </div>)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{(_b = doc.author) === null || _b === void 0 ? void 0 : _b.name}</span>
                                            <span className="text-xs text-gray-500">{(_c = doc.author) === null || _c === void 0 ? void 0 : _c.email}</span>
                                            <span className="inline-flex max-w-max mt-1 text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {(_d = doc.author) === null || _d === void 0 ? void 0 : _d.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        {doc.status === 'PENDING_REVIEW' && (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-bold border border-orange-200">
                                                <lucide_react_1.AlertTriangle className="w-3.5 h-3.5"/> Chờ Kiểm Duyệt
                                            </span>)}
                                        {doc.status === 'APPROVED' && (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold border border-emerald-200">
                                                <lucide_react_1.CheckCircle className="w-3.5 h-3.5"/> Công Khai Sạch
                                            </span>)}
                                        {doc.status === 'SPAM' && (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-bold border border-red-200">
                                                <lucide_react_1.Lock className="w-3.5 h-3.5"/> Vi Phạm Bị Khóa
                                            </span>)}
                                    </td>
                                    <td className="px-6 py-4 align-top text-right">
                                        <div className="flex flex-col gap-2 opacity-100">
                                            {doc.status !== 'APPROVED' && (<button onClick={function () { return handleAction(doc.id, 'APPROVED'); }} className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded text-xs font-bold transition-colors">
                                                    <lucide_react_1.CheckCircle className="w-3.5 h-3.5"/> Tick Sạch
                                                </button>)}
                                            {doc.status !== 'SPAM' && (<button onClick={function () { return handleAction(doc.id, 'SPAM'); }} className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 rounded text-xs font-bold transition-colors">
                                                    <lucide_react_1.Lock className="w-3.5 h-3.5"/> Khóa Cấm
                                                </button>)}
                                            <button onClick={function () { return handleAction(doc.id, 'DELETE'); }} className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition-colors">
                                                <lucide_react_1.Trash2 className="w-3.5 h-3.5"/> Xóa Tro Cốt
                                            </button>
                                        </div>
                                    </td>
                                </tr>);
        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
}
