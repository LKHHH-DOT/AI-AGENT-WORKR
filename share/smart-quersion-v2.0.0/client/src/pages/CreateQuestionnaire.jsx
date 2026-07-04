import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionnaireAPI } from '../services/api';
import './CreateQuestionnaire.css';

function CreateQuestionnaire() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiMode, setAiMode] = useState('strict');
  const [questions, setQuestions] = useState([
    { id: 'q_' + Date.now() + '_0', type: 'text', title: '', required: true, aiCheck: true, options: [] }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      id: 'q_' + Date.now() + '_' + prev.length,
      type: 'text',
      title: '',
      required: true,
      aiCheck: true,
      options: []
    }]);
  };

  const removeQuestion = (id) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(prev => prev.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (qId, oi, value) => {
    setQuestions(prev => prev.map(q =>
      q.id === qId ? { ...q, options: q.options.map((o, i) => i === oi ? value : o) } : q
    ));
  };

  const addOption = (qId) => {
    setQuestions(prev => prev.map(q =>
      q.id === qId ? { ...q, options: [...q.options, '选项' + (q.options.length + 1)] } : q
    ));
  };

  const removeOption = (qId, oi) => {
    setQuestions(prev => prev.map(q =>
      q.id === qId ? { ...q, options: q.options.filter((_, i) => i !== oi) } : q
    ));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { alert('请输入问卷标题'); return; }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].title.trim()) { alert('请填写第' + (i + 1) + '题的题目内容'); return; }
      if ((questions[i].type === 'choice' || questions[i].type === 'multiple') && questions[i].options.length < 2) {
        alert('选择题至少需要2个选项'); return;
      }
    }

    setSubmitting(true);
    try {
      const res = await questionnaireAPI.create({
        title: title.trim(),
        description: description.trim(),
        aiMode,
        questions: questions.map(q => ({
          ...q,
          title: q.title.trim(),
          options: q.options.filter(o => o.trim())
        }))
      });
      alert('问卷创建成功！');
      navigate('/fill/' + res.data.questionnaire._id);
    } catch (err) {
      alert('创建失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const questionTypes = [
    { value: 'text', label: '简答题' },
    { value: 'textarea', label: '详细回答' },
    { value: 'choice', label: '单选题' },
    { value: 'multiple', label: '多选题' },
    { value: 'rating', label: '评分题(1-10)' },
  ];

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) { alert('请输入主题'); return; }
    setAiGenerating(true);
    try {
      const axios = (await import('axios')).default;
      const res = await axios.post('/api/questionnaires/ai-generate-questions', { topic: aiTopic.trim(), count: 5 });
      const qs = res.data.questions.map((q, i) => ({ id: 'q_' + Date.now() + '_' + i, type: q.type || 'text', title: q.title, required: q.required !== false, aiCheck: q.aiCheck !== false, options: q.options || [] }));
      setQuestions(qs);
      setAiTopic('');
      alert('AI已生成' + qs.length + '道题目！');
    } catch (err) { alert('生成失败: ' + (err.response?.data?.message || err.message)); }
    finally { setAiGenerating(false); }
  };

  return (
    React.createElement('div', { className: 'page-container' },
      React.createElement('div', { className: 'fade-in' },
        React.createElement('h1', { className: 'page-title' }, '创建新问卷'),
        React.createElement('p', { className: 'page-subtitle' }, '支持简答题、选择题、评分题，AI自动审核回答质量')
      ),

      
      React.createElement('div', { className: 'card fade-in', style: { marginBottom: '20px' } },
        React.createElement('h3', { className: 'section-title' }, 'AI 智能出题'),
        React.createElement('div', { className: 'ai-gen-row' },
          React.createElement('input', { className: 'input-field', placeholder: '输入主题，例如：梦想、大学生活、人工智能...', value: aiTopic, onChange: e => setAiTopic(e.target.value) }),
          React.createElement('button', { className: 'btn btn-primary', onClick: handleAIGenerate, disabled: aiGenerating },
            aiGenerating ? '生成中...' : 'AI生成题目'
          )
        ),
        React.createElement('p', { className: 'ai-gen-hint' }, '输入主题，AI自动生成5道混合题型（简答、选择、评分）')
      ),
React.createElement('div', { className: 'card fade-in' },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, '问卷标题 *'),
          React.createElement('input', { className: 'input-field', placeholder: '例如：关于梦想的问卷调查', value: title, onChange: e => setTitle(e.target.value) })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, '问卷说明'),
          React.createElement('textarea', { className: 'textarea-field', placeholder: '告诉填写者这份问卷的目的和要求...', value: description, onChange: e => setDescription(e.target.value), rows: 3 })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'AI审核模式'),
          React.createElement('select', { className: 'input-field', value: aiMode, onChange: e => setAiMode(e.target.value) },
            React.createElement('option', { value: 'strict' }, '严格模式 - 偏离主题即拦截'),
            React.createElement('option', { value: 'moderate' }, '中等模式 - 轻微跑题可接受'),
            React.createElement('option', { value: 'loose' }, '宽松模式 - 仅拦截明显乱填')
          )
        )
      ),

      React.createElement('div', { className: 'card fade-in' },
        React.createElement('div', { className: 'section-header' },
          React.createElement('h2', { className: 'section-title' }, '题目设置'),
          React.createElement('button', { className: 'btn btn-secondary btn-sm', onClick: addQuestion }, '添加题目')
        ),
        questions.map((q, idx) =>
          React.createElement('div', { key: q.id, className: 'question-item fade-in' },
            React.createElement('div', { className: 'qi-header' },
              React.createElement('span', { className: 'qi-number' }, '第' + (idx + 1) + '题'),
              questions.length > 1 ? React.createElement('button', { className: 'btn btn-danger btn-xs', onClick: () => removeQuestion(q.id) }, '删除') : null
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, '题目内容 *'),
              React.createElement('input', { className: 'input-field', placeholder: '输入题目...', value: q.title, onChange: e => updateQuestion(q.id, 'title', e.target.value) })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, '题目类型'),
              React.createElement('select', { className: 'input-field', value: q.type, onChange: e => updateQuestion(q.id, 'type', e.target.value) },
                questionTypes.map(t => React.createElement('option', { key: t.value, value: t.value }, t.label))
              )
            ),

            // 选择题选项
            (q.type === 'choice' || q.type === 'multiple') ?
              React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'form-label' }, '选项'),
                q.options.map((opt, oi) =>
                  React.createElement('div', { key: oi, className: 'option-row' },
                    React.createElement('input', { className: 'input-field option-input', value: opt, onChange: e => updateOption(q.id, oi, e.target.value) }),
                    React.createElement('button', { className: 'btn btn-danger btn-xs', onClick: () => removeOption(q.id, oi) }, 'x')
                  )
                ),
                React.createElement('button', { className: 'btn btn-secondary btn-xs', onClick: () => addOption(q.id), style: { marginTop: '6px' } }, '添加选项')
              ) : null,

            React.createElement('div', { className: 'qi-options' },
              React.createElement('label', { className: 'checkbox-label' },
                React.createElement('input', { type: 'checkbox', checked: q.required, onChange: e => updateQuestion(q.id, 'required', e.target.checked) }),
                '必填'
              ),
              React.createElement('label', { className: 'checkbox-label' },
                React.createElement('input', { type: 'checkbox', checked: q.aiCheck, onChange: e => updateQuestion(q.id, 'aiCheck', e.target.checked) }),
                'AI审核'
              )
            )
          )
        )
      ),

      React.createElement('div', { className: 'form-actions fade-in' },
        React.createElement('button', { className: 'btn btn-secondary', onClick: () => navigate('/') }, '返回'),
        React.createElement('button', { className: 'btn btn-primary', onClick: handleSubmit, disabled: submitting }, submitting ? '创建中...' : '发布问卷')
      )
    )
  );
}

export default CreateQuestionnaire;