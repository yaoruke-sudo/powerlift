
import React from 'react';
import { ViewState } from '../types';

interface PrivacyPolicyViewProps {
    onNavigate: (view: ViewState) => void;
}

/**
 * 应用内隐私政策完整展示页面
 * vivo 审核要求应用内必须有可访问的隐私政策
 */
const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onNavigate }) => {
    return (
        <div className="flex flex-col h-full bg-background-dark overflow-hidden">
            {/* 顶部导航栏 */}
            <header className="px-6 pt-12 pb-4 shrink-0 flex items-center gap-3">
                <button
                    onClick={() => onNavigate('profile')}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-surface-dark border border-white/5 text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h1 className="text-xl font-black text-white">隐私政策</h1>
            </header>

            {/* 隐私政策正文 */}
            <main className="flex-1 overflow-y-auto px-6 pb-12 scrollbar-hide">
                <div className="bg-surface-dark rounded-3xl border border-white/5 p-6 space-y-6">
                    {/* 标题和日期 */}
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black text-white">「练」隐私政策</h2>
                        <p className="text-xs text-slate-500">最后更新日期：2026年2月14日</p>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">
                        欢迎使用「练」（以下简称"本应用"）。我们非常重视您的个人隐私和数据安全。本隐私政策旨在向您说明本应用如何处理您的信息。请在使用本应用前仔细阅读本政策。
                    </p>

                    {/* 一、应用简介 */}
                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">一、应用简介</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            「练」是一款健身训练记录工具，帮助用户记录和管理个人健身训练数据。本应用为<strong className="text-white">完全离线应用</strong>，无需联网即可使用全部功能。
                        </p>
                    </section>

                    {/* 二、信息收集与使用 */}
                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">二、信息收集与使用</h3>
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-3">
                            <p className="text-sm text-primary font-bold">🔒 本应用不收集任何个人信息。</p>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">具体而言：</p>
                        <ul className="text-sm text-slate-300 leading-relaxed space-y-1.5 list-none">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>本应用<strong className="text-white">不会</strong>收集您的姓名、手机号、邮箱等个人身份信息</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>本应用<strong className="text-white">不会</strong>收集您的地理位置信息</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>本应用<strong className="text-white">不会</strong>访问您的通讯录、短信、通话记录等</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>本应用<strong className="text-white">不会</strong>收集设备标识符（如 IMEI、OAID）或其他设备信息</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>本应用<strong className="text-white">不会</strong>向任何第三方服务器发送任何数据</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>本应用<strong className="text-white">不包含</strong>任何第三方 SDK、广告、分析或追踪工具</span>
                            </li>
                        </ul>
                    </section>

                    {/* 三、数据存储 */}
                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">三、数据存储</h3>
                        <p className="text-sm text-slate-300 leading-relaxed mb-2">
                            您在本应用中记录的所有训练数据（包括训练计划、训练记录、上传的照片等）均<strong className="text-white">仅保存在您的设备本地</strong>，具体存储于应用的本地存储区域中。
                        </p>
                        <ul className="text-sm text-slate-300 leading-relaxed space-y-1.5 list-none">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>数据完全由您掌控，本应用开发者无法访问您的任何数据</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>卸载应用将会清除所有本地存储的数据，请注意备份</span>
                            </li>
                        </ul>
                    </section>

                    {/* 四、权限说明 */}
                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">四、权限说明</h3>
                        <p className="text-sm text-slate-300 leading-relaxed mb-2">本应用可能会请求以下设备权限：</p>
                        <ul className="text-sm text-slate-300 leading-relaxed space-y-1.5 list-none">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span><strong className="text-white">存储/相册权限</strong>：仅用于您主动上传训练照片时读取本地图片，不会自动访问或上传您的照片</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span><strong className="text-white">相机权限</strong>（如适用）：仅用于您主动拍摄训练照片，不会在后台启用相机</span>
                            </li>
                        </ul>
                        <p className="text-sm text-slate-400 mt-2">以上权限均为可选权限，拒绝授权不影响应用核心功能的使用。</p>
                    </section>

                    {/* 五、信息安全 */}
                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">五、信息安全</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            由于本应用完全离线运行且不收集任何数据，因此不存在数据泄露、数据传输等安全风险。您的数据安全性取决于您设备本身的安全防护。
                        </p>
                    </section>

                    {/* 六、未成年人保护 */}
                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">六、未成年人保护</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            本应用不针对未成年人进行数据收集。由于本应用不收集任何个人信息，不存在未成年人个人信息保护问题。
                        </p>
                    </section>

                    {/* 七、隐私政策更新 */}
                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">七、隐私政策更新</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，并更新"最后更新日期"。建议您定期查阅本政策。
                        </p>
                    </section>

                    {/* 八、联系我们 */}
                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">八、联系我们</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：</p>
                        <p className="text-sm text-primary font-bold mt-1">邮箱：1444893869@qq.com</p>
                    </section>

                    {/* 底部版权 */}
                    <div className="pt-4 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-500">© 2026 练 · 保留所有权利</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicyView;
