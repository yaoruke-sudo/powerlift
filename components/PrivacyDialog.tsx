
import React from 'react';

interface PrivacyDialogProps {
    onAgree: () => void;
}

/**
 * 首次启动隐私政策弹窗
 * vivo 应用商店要求：首次启动必须以弹窗方式告知用户个人信息处理规则
 * 用户点击"同意"后将状态写入 localStorage，后续不再弹出
 */
const PrivacyDialog: React.FC<PrivacyDialogProps> = ({ onAgree }) => {
    const handleDisagree = () => {
        alert('您需要同意隐私政策才能使用本应用。如不同意，请退出应用。');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* 遮罩层 */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* 弹窗主体 */}
            <div className="relative bg-surface-dark rounded-3xl border border-white/10 mx-6 max-w-md w-full shadow-2xl overflow-hidden">
                {/* 标题区域 */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-icons-round text-primary text-xl">privacy_tip</span>
                        <h2 className="text-lg font-black text-white">隐私政策声明</h2>
                    </div>
                    <p className="text-xs text-slate-500">请仔细阅读以下内容</p>
                </div>

                {/* 隐私政策摘要内容 — 可滚动区域 */}
                <div className="px-6 max-h-[50vh] overflow-y-auto scrollbar-hide">
                    <div className="text-sm text-slate-300 leading-relaxed space-y-3">
                        <p>
                            欢迎使用「练」（以下简称"本应用"）。我们非常重视您的个人隐私和数据安全。在您使用本应用之前，请阅读以下隐私政策要点：
                        </p>

                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-2">
                            <div className="flex items-start gap-2">
                                <span className="material-icons-round text-primary text-sm mt-0.5">check_circle</span>
                                <span>本应用为<strong className="text-white">完全离线应用</strong>，不会联网传输任何数据</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="material-icons-round text-primary text-sm mt-0.5">check_circle</span>
                                <span>本应用<strong className="text-white">不收集任何个人信息</strong>（包括姓名、手机号、位置、设备标识等）</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="material-icons-round text-primary text-sm mt-0.5">check_circle</span>
                                <span>所有训练数据<strong className="text-white">仅保存在您的设备本地</strong></span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="material-icons-round text-primary text-sm mt-0.5">check_circle</span>
                                <span>本应用<strong className="text-white">不包含</strong>任何第三方 SDK、广告或追踪工具</span>
                            </div>
                        </div>

                        <p className="text-slate-400">
                            <strong className="text-slate-300">权限说明：</strong>本应用可能请求存储/相册权限（用于上传训练照片）和相机权限（用于拍摄训练照片），均为可选权限，拒绝授权不影响核心功能。
                        </p>

                        <p className="text-slate-400">
                            <strong className="text-slate-300">数据安全：</strong>由于本应用完全离线运行且不收集任何数据，不存在数据泄露风险。卸载应用将清除所有本地数据。
                        </p>

                        <p className="text-slate-500 text-xs">
                            您可以在"我的"页面随时查看完整隐私政策。如有疑问请联系：1444893869@qq.com
                        </p>
                    </div>
                </div>

                {/* 操作按钮 */}
                <div className="px-6 py-5 flex gap-3">
                    <button
                        onClick={handleDisagree}
                        className="flex-1 py-3 rounded-2xl border border-white/10 text-slate-400 font-bold text-sm transition-colors hover:border-white/20"
                    >
                        不同意
                    </button>
                    <button
                        onClick={onAgree}
                        className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
                    >
                        同意并继续
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyDialog;
