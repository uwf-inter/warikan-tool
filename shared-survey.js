// アンケートの共通Reactコンポーネント (Vanilla JS版 - Babel不要)
window.SurveyComponent = ({ pageName, themeColorClass, hoverColorClass, activeColorClass, lightColorClass, choices }) => {
    const { useState, useEffect, createElement: e } = React;

    const defaultChoices = ["メルカリ・フリマ計算", "引越し・家賃の日割り", "同人誌・即売会レジ", "その他（自由入力）"];
    const surveyChoices = choices || defaultChoices;

    const [selected, setSelected] = useState(() => {
        return localStorage.getItem(`surveySelection_${pageName}`) || '';
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSurveyClick = (choice) => {
        setSelected(choice);
    };

    const handleSurveySubmit = async () => {
        if (!selected) {
            alert('選択肢を選んでください');
            return;
        }

        setIsSubmitting(true);

        const data = {
            survey: selected,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            page: pageName
        };

        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
        const forceProduction = window.location.search.includes('force-production=true');
        const isProduction = !isLocalhost || forceProduction;

        if (isProduction) {
            try {
                const scriptUrl = 'https://script.google.com/macros/s/AKfycbw6v_heJJDHSm5RZgLjgxFqoid9Hb4i-hJcMM39TAcBnsWeIaP0ClwKjGmTcG3-mS_T/exec';
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                await fetch(scriptUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    mode: 'no-cors',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                setIsSubmitted(true);
                localStorage.removeItem(`surveySelection_${pageName}`);
            } catch (error) {
                console.error('❌ 送信エラー:', error);
                let errorMessage = '送信エラーが発生しました。';
                if (error && error.name === 'AbortError') {
                    errorMessage = '通信がタイムアウトしました。ネットワーク環境を確認してください。';
                }
                alert(errorMessage);
                setIsSubmitting(false);
            }
        } else {
            try {
                const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
                surveys.push({ ...data, id: Date.now() });
                localStorage.setItem('surveys', JSON.stringify(surveys));
                console.log('✅ ローカルに保存しました:', surveys.length, '件');

                setIsSubmitted(true);
                localStorage.removeItem(`surveySelection_${pageName}`);
            } catch (error) {
                console.error('❌ ローカル保存エラー:', error);
                alert('ローカル保存に失敗しました。');
                setIsSubmitting(false);
            }
        }
    };

    if (isSubmitted) {
        return e('div', { className: `text-center py-6 px-4 space-y-3 rounded-2xl ${lightColorClass} bg-opacity-70 border border-current border-opacity-20` },
            e('div', { className: 'text-3xl mb-2' }, '🎉'),
            e('p', { className: 'font-bold text-sm' }, 'ご協力ありがとうございました！'),
            e('p', { className: 'text-xs opacity-90 font-medium' }, 'いただいたご意見は今後の開発の参考にさせていただきます。')
        );
    }

    return e('div', { className: 'space-y-4' },
        e('div', { className: 'flex flex-wrap gap-2' },
            surveyChoices.map(choice => 
                e('button', {
                    key: choice,
                    onClick: () => handleSurveyClick(choice),
                    className: `px-3 h-10 rounded-2xl font-bold text-sm transition-colors ${selected === choice
                        ? `${activeColorClass} text-white`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`
                }, choice)
            )
        ),
        e('button', {
            onClick: handleSurveySubmit,
            disabled: !selected || isSubmitting,
            className: `w-full h-12 rounded-2xl font-black text-sm transition-all mt-2 ${selected && !isSubmitting
                ? `${themeColorClass} text-white ${hoverColorClass} shadow-lg active:scale-95`
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`
        }, isSubmitting ? '送信中...' : '回答を送信する')
    );
};
