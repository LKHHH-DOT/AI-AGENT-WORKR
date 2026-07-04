import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { questionnaireAPI } from '../services/api'
import './Results.css'

function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadResults() }, [id])

  const loadResults = async () => {
    try {
      setLoading(true)
      const res = await questionnaireAPI.getResults(id)
      setResults(res.data)
    } catch (err) {
      alert('获取结果失败')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return React.createElement('div', { className: 'page-container' },
      React.createElement('div', { className: 'loading fade-in' },
        React.createElement('div', { className: 'loading-spinner' }),
        React.createElement('span', null, '加载结果中...')
      )
    )
  }

  return React.createElement('div', { className: 'page-container' },
    React.createElement('div', { className: 'fade-in' },
      React.createElement('h1', { className: 'page-title' }, results.title + ' - 结果'),
      React.createElement('p', { className: 'page-subtitle' }, '共收到' + results.totalResponses + '份回答')
    ),
    React.createElement('div', { className: 'card fade-in' },
      React.createElement('div', { className: 'stats-grid' },
        React.createElement('div', { className: 'stat-item' },
          React.createElement('div', { className: 'stat-number' }, results.totalResponses),
          React.createElement('div', { className: 'stat-label' }, '总回答数')
        ),
        React.createElement('div', { className: 'stat-item' },
          React.createElement('div', { className: 'stat-number' }, results.questions.length),
          React.createElement('div', { className: 'stat-label' }, '题目数')
        ),
        React.createElement('div', { className: 'stat-item' },
          React.createElement('div', { className: 'stat-number' }, results.responses.filter(r => r.allPassed).length),
          React.createElement('div', { className: 'stat-label' }, '有效回答')
        )
      )
    ),
    results.responses.length === 0
      ? React.createElement('div', { className: 'card fade-in', style: { textAlign: 'center', padding: '60px 20px' } },
          React.createElement('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📭'),
          React.createElement('p', { style: { color: '#888' } }, '还没有人填写这份问卷')
        )
      : results.responses.map((response, ri) =>
          React.createElement('div', { key: ri, className: 'card response-card fade-in' },
            React.createElement('div', { className: 'response-header' },
              React.createElement('span', { className: 'response-user' }, '👤' + (response.respondentName || '匿名')),
              React.createElement('span', { className: 'response-time' }, new Date(response.submittedAt).toLocaleString('zh-CN')),
              React.createElement('span', { className: 'badge ' + (response.allPassed ? 'badge-success' : 'badge-danger') },
                response.allPassed ? '已通过' : '未通过'
              ),
              response.fillTime
                ? React.createElement('span', { className: 'fill-time' }, '用时:' + response.fillTime + '秒')
                : null
            ),
            React.createElement('div', { className: 'response-answers' },
              response.answers.map((ans, ai) => {
                const question = results.questions.find(q => q.id === ans.questionId)
                return React.createElement('div', { key: ai, className: 'answer-item' },
                  React.createElement('div', { className: 'answer-question' },
                    'Q' + (results.questions.indexOf(question) + 1) + ': ' + (question?.title || '未知题目')
                  ),
                  React.createElement('div', { className: 'answer-content' }, ans.answer || '(未填写)'),
                  React.createElement('div', { className: 'answer-meta' },
                    ans.aiScore
                      ? React.createElement('span', { className: 'score-badge' }, 'AI评分: ' + ans.aiScore + '/30')
                      : null,
                    ans.aiPassed !== undefined
                      ? React.createElement('span', { className: 'badge ' + (ans.aiPassed ? 'badge-success' : 'badge-danger') }, ans.aiPassed ? 'AI通过' : 'AI拒绝')
                      : null
                  ),
                  ans.aiFeedback
                    ? React.createElement('div', { className: 'answer-ai-feedback ' + (ans.aiPassed ? 'passed' : 'failed') }, ans.aiFeedback)
                    : null
                )
              })
            )
          )
        ),
    React.createElement('div', { className: 'form-actions fade-in' },
      React.createElement('button', { className: 'btn btn-secondary', onClick: () => navigate('/') }, '返回首页'),
      React.createElement('button', { className: 'btn btn-primary', onClick: () => navigate('/fill/' + id) }, '继续填写')
    )
  )
}

export default Results
