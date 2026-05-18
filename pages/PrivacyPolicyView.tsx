import React from 'react';
import { ViewState } from '../types';
import { PRIVACY_POLICY_DATE_TEXT, SUPPORT_EMAIL, SUPPORT_REPLY_TIME } from '../constants';

interface PrivacyPolicyViewProps {
    onNavigate: (view: ViewState) => void;
}

const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onNavigate }) => {
    return (
        <div className="flex flex-col h-full bg-background-dark overflow-hidden">
            <header className="px-6 pt-12 pb-4 shrink-0 flex items-center gap-3">
                <button
                    onClick={() => onNavigate('profile')}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-surface-dark border border-white/5 text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h1 className="text-xl font-black text-white">隐私政策</h1>
            </header>

            <main className="flex-1 overflow-y-auto px-6 pb-12 scrollbar-hide">
                <div className="bg-surface-dark rounded-3xl border border-white/5 p-6 space-y-6">
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black text-white">「练」隐私政策</h2>
                        <p className="text-xs text-slate-500 leading-relaxed">{PRIVACY_POLICY_DATE_TEXT}</p>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-sm text-slate-300 leading-relaxed space-y-1">
                        <p><strong className="text-white">应用名称：</strong>练</p>
                        <p><strong className="text-white">开发者名称/个人信息处理者：</strong>姚如轲</p>
                        <p><strong className="text-white">客服反馈邮箱：</strong>{SUPPORT_EMAIL}</p>
                        <p><strong className="text-white">回复时效：</strong>{SUPPORT_REPLY_TIME}</p>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">
                        欢迎使用「练」（以下简称“本应用”）。我们非常重视您的个人隐私和数据安全。本隐私政策旨在向您说明本应用如何处理您的信息，以及您如何管理自己的本地数据。请在使用本应用前仔细阅读本政策。
                    </p>

                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">一、应用简介</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            「练」是一款健身训练记录工具，帮助用户记录和管理个人健身训练数据。本应用采用本地离线存储方式，您的训练记录、身体数据和照片等内容仅保存在您的设备本地。
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">二、信息收集与使用</h3>
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-3">
                            <p className="text-sm text-primary font-bold">本应用不收集、上传或向开发者服务器传输任何个人信息。</p>
                        </div>
                        <ul className="text-sm text-slate-300 leading-relaxed space-y-1.5 list-none">
                            {[
                                '本应用不会收集您的姓名、手机号、邮箱、身份证件号码等个人身份信息',
                                '本应用不会收集您的地理位置信息',
                                '本应用不会访问您的通讯录、短信、通话记录等信息',
                                '本应用不会收集设备标识符（如 IMEI、OAID、Android ID）或其他用于追踪识别的设备信息',
                                '本应用不会向任何第三方服务器发送您的训练数据、照片或个人资料',
                                '本应用不包含广告 SDK、统计分析 SDK、推送 SDK 或其他第三方追踪工具',
                            ].map(item => (
                                <li key={item} className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">三、本地数据存储</h3>
                        <p className="text-sm text-slate-300 leading-relaxed mb-2">
                            您在本应用中主动填写或导入的数据，包括训练记录、体重身高信息、个人头像、体态照片、照片日期和备注等，均仅保存在设备本地的应用存储区域中。
                        </p>
                        <ul className="text-sm text-slate-300 leading-relaxed space-y-1.5 list-none">
                            {[
                                '开发者姚如轲无法远程访问、查看、修改或删除您设备本地保存的数据',
                                '您可以在应用内自行修改或删除训练记录、照片等内容',
                                '卸载本应用通常会清除本地存储的数据，请您根据需要提前自行备份',
                            ].map(item => (
                                <li key={item} className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">四、设备权限说明</h3>
                        <ul className="text-sm text-slate-300 leading-relaxed space-y-1.5 list-none">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span><strong className="text-white">相册/文件选择能力：</strong>仅用于您主动选择头像或导入训练照片时读取您选择的本地图片；本应用不会自动扫描、读取或上传您的相册内容。</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span><strong className="text-white">相机能力（如系统文件选择器提供）：</strong>仅用于您主动拍摄并导入图片时使用；本应用不会在后台启用相机。</span>
                            </li>
                        </ul>
                        <p className="text-sm text-slate-400 mt-2">以上能力仅在您主动操作时触发。拒绝或取消相关授权，不影响训练记录等核心功能使用。</p>
                    </section>

                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">五、对外共享、转让和公开披露</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            本应用不收集您的个人信息，因此不会向任何公司、组织或个人共享、转让或公开披露您的个人信息。如法律法规另有强制要求，我们将依法处理。
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">六、用户权利</h3>
                        <p className="text-sm text-slate-300 leading-relaxed mb-2">
                            由于本应用不上传和不集中存储您的个人信息，开发者无法通过后台为您查询、更正或删除本地数据。您可以在应用内编辑个人资料、训练记录和照片信息，也可以卸载应用清除应用本地存储的数据。
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">七、信息安全</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            本应用的数据主要保存在您的设备本地，数据安全性取决于您设备本身的安全防护能力。建议您妥善保管设备、设置锁屏密码，并谨慎授予他人设备访问权限。
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">八、未成年人保护</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            本应用不面向未成年人收集个人信息。如未成年人使用本应用，应在监护人指导下使用。由于本应用不上传个人信息，不存在开发者集中处理未成年人个人信息的情形。
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">九、隐私政策更新</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            我们可能会根据功能调整或合规要求更新本隐私政策。更新后的政策将在本页面发布，并更新“最后更新日期”。建议您定期查阅本政策。
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-black text-white mb-2 pl-3 border-l-4 border-primary">十、联系我们与客服反馈</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">如您对本隐私政策、个人信息保护相关事项、应用功能或服务有任何疑问、意见、投诉或建议，请通过以下客服反馈渠道联系开发者：</p>
                        <p className="text-sm text-primary font-bold mt-1">开发者名称：姚如轲</p>
                        <p className="text-sm text-primary font-bold mt-1">客服反馈邮箱：{SUPPORT_EMAIL}</p>
                        <p className="text-sm text-primary font-bold mt-1">回复时效：{SUPPORT_REPLY_TIME}</p>
                    </section>

                    <div className="pt-4 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-500">© 2026 练 · 开发者：姚如轲 · 保留所有权利</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicyView;
