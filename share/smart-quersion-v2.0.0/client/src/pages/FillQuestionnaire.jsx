import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionnaireAPI, aiAPI } from '../services/api';
import './FillQuestionnaire.css';

function FillQuestionnaire() {
  const { id } = useParams(); const navigate = useNavigate();
  const [questionnaire, setQ] = useState(null);
  const [answers, setA] = useState({}); const [aiStatus, setS] = useState({});
  const [loading, setL] = useState(true); const [submitting, setSub] = useState(false);
  const [startTime] = useState(Date.now());
  const timers = useRef({}); const cache = useRef({});

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const res = await questionnaireAPI.getById(id);
      setQ(res.data);
      const a = {}, s = {};
      res.data.questions.forEach(q => { a[q.id] = q.type === 'choice' || q.type === 'multiple' ? [] : ''; s[q.id] = { st: 'idle', pass: false, fb: '', sc: 0 }; });
      setA(a); setS(s);
    } catch(e) { alert('失败'); navigate('/'); }
    finally { setL(false); }
  };

  // 极简本地检查：只抓最明显的敷衍，其余全交给AI
  const quickCheck = (text) => {
    if (!text || !text.trim()) return null;
    const t = text.trim();
    if (t.length <= 1) return { pass: false, fb: '回答太短了' };
    const trash = [/^(好|是|嗯|哦|啊|对|不|没|有|行|可以|不知道|没有想法|无|随便|都行|没什么|还行|不好|不行|一般|就这样)$/i, /^(111|222|aaa|bbb|test|测试|哈哈|呵呵|嘻嘻|asdf|qwer|zxcv)$/i, /^[0-9]{4,}$/, /^[a-z]{5,}$/i];
    for (const p of trash) { if (p.test(t)) return { pass: false, fb: '内容敷衍，请认真填写' }; }
    return null;
  };

  const handleChange = useCallback((qId, val, type) => {
    if (type === 'choice') { setA(p => ({ ...p, [qId]: val })); if (val) trigger(qId, val); return; }
    if (type === 'multiple') { setA(p => { const c = p[qId] || []; return { ...p, [qId]: c.includes(val) ? c.filter(v => v !== val) : [...c, val] }; }); return; }
    setA(p => ({ ...p, [qId]: val }));
    trigger(qId, val);
  }, [questionnaire]);

  const trigger = (qId, val) => {
    if (timers.current[qId]) clearTimeout(timers.current[qId]);

    if (!val || (typeof val === 'string' && !val.trim())) { setS(p => ({ ...p, [qId]: { st: 'idle', pass: false, fb: '', sc: 0 } })); return; }
    const text = typeof val === 'string' ? val.trim() : String(val);
    const q = questionnaire?.questions.find(x => x.id === qId);
    if (!q || !q.aiCheck) return;

    // 先做极简本地检查
    const local = quickCheck(text);
    if (local) { setS(p => ({ ...p, [qId]: { st: 'fail', pass: false, fb: local.fb, sc: 0 } })); return; }

    // 等用户停1.2秒后调AI
    setS(p => ({ ...p, [qId]: { st: 'check', pass: false, fb: 'AI审核中...', sc: 0 } }));
    timers.current[qId] = setTimeout(async () => {
      const key = q.title + '||' + text;
      if (cache.current[key]) {
        const c = cache.current[key];
        setS(p => ({ ...p, [qId]: { st: c.pass ? 'pass' : 'fail', pass: c.pass, fb: c.fb, sc: c.sc } }));
        return;
      }
      try {
        const res = await aiAPI.check(q.title, text);
        const r = res.data;
        cache.current[key] = { pass: r.passed, fb: r.passed ? (r.praise || '回答很好') : (r.reason || ''), sc: r.score || 0, praise: r.praise || '' };
        setS(p => ({
          ...p,
          [qId]: { st: r.passed ? 'pass' : 'fail', pass: r.passed, fb: r.passed ? (r.praise || 'AI通过') : (r.reason || ''), sc: r.score || 0, praise: r.praise || '' }
        }));
      } catch(e) {
        setS(p => ({ ...p, [qId]: { st: 'pass', pass: true, fb: '服务暂不可用', sc: 0 } }));
      }
    }, 1200);
  };

  const submit = async () => {
    const ft = Math.floor((Date.now() - startTime) / 1000);
    for (const q of questionnaire.questions) {
      const a = answers[q.id];
      if (q.required) {
        if (q.type === 'multiple' && (!a || a.length === 0)) { alert('请回答第' + (questionnaire.questions.indexOf(q)+1) + '题'); return; }
        if ((q.type === 'text' || q.type === 'textarea') && (!a || !a.trim())) { alert('请回答第' + (questionnaire.questions.indexOf(q)+1) + '题'); return; }
        if ((q.type === 'choice' || q.type === 'rating') && (a === undefined || a === '')) { alert('请回答第' + (questionnaire.questions.indexOf(q)+1) + '题'); return; }
      }
    }
    for (const q of questionnaire.questions) {
      if (!q.aiCheck) continue;
      const s = aiStatus[q.id];
      if (!s || s.st === 'check') { alert('AI正在审核第' + (questionnaire.questions.indexOf(q)+1) + '题，请稍后'); return; }
      if (!s.pass) { alert('第' + (questionnaire.questions.indexOf(q)+1) + '题' + s.fb + '，请修改'); return; }
    }
    setSub(true);
    try {
      const sa = questionnaire.questions.map(q => {
        const a = answers[q.id]; const t = Array.isArray(a) ? a.join(', ') : (a || ''); const s = aiStatus[q.id] || {};
        return { questionId: q.id, question: q.title, answer: t, aiPassed: s.pass !== false, aiScore: s.sc || 0, aiFeedback: s.fb || '' };
      });
      await questionnaireAPI.submit(id, { answers: sa, fillTime: ft });
      alert('提交成功！'); navigate('/results/' + id);
    } catch(e) { alert('失败'); }
    finally { setSub(false); }
  };

  const badge = (s) => {
    if (!s || s.st === 'idle') return React.createElement('div', { className: 'ai-status idle' }, '填写后将检测');
    if (s.st === 'check') return React.createElement('div', { className: 'ai-status checking' }, s.fb);
    if (s.st === 'fail') return React.createElement('div', { className: 'ai-status failed' }, '❌ ' + s.fb);
    return React.createElement('div', { className: 'ai-status passed' }, '✅ ' + (s.praise || s.fb) + (s.sc ? ' [' + s.sc + '/30]' : ''));
  };

  if (loading) return React.createElement('div', { className: 'page-container' }, React.createElement('div', { className: 'loading' }, React.createElement('div', { className: 'loading-spinner' })));

  return React.createElement('div', { className: 'page-container' },
    React.createElement('div', { className: 'fade-in' }, React.createElement('h1', { className: 'page-title' }, questionnaire.title), questionnaire.description ? React.createElement('p', { className: 'page-subtitle' }, questionnaire.description) : null),
    React.createElement('div', { className: 'fill-notice card fade-in' },
      React.createElement('div', { className: 'notice-icon' }, '🤖'),
      React.createElement('div', { className: 'notice-text' }, React.createElement('strong', null, 'AI智能审核'), React.createElement('p', null, '停下输入1.2秒后自动AI审核，同内容不重复调用，省钱又准确。')),
    ),
    questionnaire.questions.map((q, idx) =>
      React.createElement('div', { key: q.id, className: 'card question-card fade-in' },
        React.createElement('div', { className: 'question-header' }, React.createElement('span', { className: 'q-number' }, 'Q' + (idx+1)), React.createElement('span', { className: 'q-title' }, q.title), q.required ? React.createElement('span', { className: 'required-mark' }, '*') : null, q.aiCheck ? React.createElement('span', { className: 'ai-badge' }, 'AI') : null),
        (q.type === 'text' || q.type === 'textarea' || !q.type) ?
          React.createElement('textarea', { className: 'textarea-field' + (aiStatus[q.id]?.st === 'pass' ? ' input-success' : (aiStatus[q.id]?.st === 'fail' ? ' input-error' : '')), placeholder: '请认真填写...', value: answers[q.id] || '', onChange: e => handleChange(q.id, e.target.value, q.type), rows: 3 })
        : q.type === 'choice' ? React.createElement('div', { className: 'answer-area' }, (q.options || []).map((o, oi) => React.createElement('label', { key: oi, className: 'choice-label' }, React.createElement('input', { type: 'radio', name: 'q_' + q.id, value: o, checked: answers[q.id] === o, onChange: () => handleChange(q.id, o, 'choice') }), React.createElement('span', null, o))))
        : q.type === 'multiple' ? React.createElement('div', { className: 'answer-area' }, (q.options || []).map((o, oi) => React.createElement('label', { key: oi, className: 'choice-label' }, React.createElement('input', { type: 'checkbox', value: o, checked: (answers[q.id] || []).includes(o), onChange: () => handleChange(q.id, o, 'multiple') }), React.createElement('span', null, o))))
        : q.type === 'rating' ? React.createElement('div', { className: 'answer-area rating-area' }, [1,2,3,4,5,6,7,8,9,10].map(n => React.createElement('button', { key: n, className: 'rating-btn' + (answers[q.id] === n ? ' active' : ''), onClick: () => handleChange(q.id, n, 'choice') }, n)))
        : null,
        q.aiCheck ? badge(aiStatus[q.id]) : null
      )
    ),
    React.createElement('div', { className: 'form-actions' }, React.createElement('button', { className: 'btn btn-secondary', onClick: () => navigate('/') }, '返回'), React.createElement('button', { className: 'btn btn-primary', onClick: submit, disabled: submitting }, submitting ? '提交中...' : '提交问卷'))
  );
}
export default FillQuestionnaire;