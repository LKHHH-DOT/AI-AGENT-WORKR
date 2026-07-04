import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionnaireAPI } from '../services/api';
import './AdminLog.css';

function AdminLog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadResults(); }, [id]);

  const loadResults = async () => {
    try {
      const res = await questionnaireAPI.getResults(id);
      setResults(res.data);
    } catch (err) { alert('获取失败'); navigate('/'); }
    finally { setLoading(false); }
  };

  if (loading) return null;
  if (!results) return null;

  const passed = results.responses.filter(r => r.allPassed).length;
  const failed = results.responses.filter(r => !r.allPassed).length;
  const filtered = filter === 'all' ? results.responses :
    filter === 'passed' ? results.responses.filter(r => r.allPassed) :
    results.responses.filter(r => !r.allPassed);

  return (
    React.createElement('div', { className: 'page-container' },
      React.createElement('h1', { className: 'page-title' }, '审核日志: ' + results.title),
      React.createElement('p', { className: 'page-subtitle' }, '共' + results.totalResponses + '份回答, 通过' + passed + ', 拒绝' + failed),
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'filter-tabs' },
          React.createElement('button', { className: 'filter-tab ' + (filter === 'all' ? 'active' : ''), onClick: () => setFilter('all') }, '全部(' + results.totalResponses + ')'),
          React.createElement('button', { className: 'filter-tab ' + (filter === 'passed' ? 'active' : ''), onClick: () => setFilter('passed') }, '通过(' + passed + ')'),
          React.createElement('button', { className: 'filter-tab ' + (filter === 'failed' ? 'active' : ''), onClick: () => setFilter('failed') }, '拒绝(' + failed + ')'),
        )
      ),
      filtered.length === 0
        ? React.createElement('div', { className: 'card', style: { textAlign: 'center', padding: '40px' } }, '暂无数据')
        : filtered.map((r, ri) =>
            React.createElement('div', { key: ri, className: 'card response-card' },
              React.createElement('div', { className: 'response-header' },
                React.createElement('span', null, '#' + (ri+1) + ' ' + (r.respondentName || '匿名')),
                React.createElement('span', { className: 'response-time' }, new Date(r.submittedAt).toLocaleString('zh-CN')),
                React.createElement('span', { className: 'badge ' + (r.allPassed ? 'badge-success' : 'badge-danger') }, r.allPassed ? '通过' : '拒绝'),
                r.fillTime ? React.createElement('span', { className: 'fill-time' }, '用时:' + r.fillTime + '秒') : null,
              ),
              r.answers.map((ans, ai) => {
                const q = results.questions.find(qq => qq.id === ans.questionId);
                return React.createElement('div', { key: ai, className: 'admin-answer-item' },
                  React.createElement('div', { className: 'admin-q' }, 'Q' + (results.questions.indexOf(q)+1) + ': ' + (q ? q.title : '')),
                  React.createElement('div', { className: 'admin-a' }, ans.answer),
                  React.createElement('div', { className: 'admin-ai-info' },
                    React.createElement('span', { className: 'badge ' + (ans.aiPassed ? 'badge-success' : 'badge-danger') }, ans.aiPassed ? 'AI通过' : 'AI拒绝'),
                    ans.aiScore ? React.createElement('span', { className: 'score-badge' }, '评分:' + ans.aiScore + '/30') : null,
                  ),
                  ans.aiFeedback ? React.createElement('div', { className: 'admin-feedback ' + (ans.aiPassed ? 'passed' : 'failed') }, ans.aiFeedback) : null,
                );
              })
            )
          ),
      React.createElement('div', { className: 'form-actions', style: { marginTop: '20px' } },
        React.createElement('button', { className: 'btn btn-secondary', onClick: () => navigate(-1) }, '返回'),
      )
    )
  );
}
export default AdminLog;