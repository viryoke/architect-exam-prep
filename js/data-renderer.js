// 系统架构设计师备考网站数据加载模块

// 加载JSON数据
async function loadJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to load data:', error);
        return null;
    }
}

// ==================== 知识模块渲染 ====================
const KnowledgeRenderer = {
    data: null,
    currentCategory: null,

    async init() {
        this.data = await loadJSON('data/knowledge.json');
        if (!this.data) return;
        this.renderDirectory();

        // 默认选中第一个分类
        if (this.data.categories.length > 0) {
            const firstLink = document.querySelector('.directory-link');
            if (firstLink) {
                this.selectCategory(this.data.categories[0].id, firstLink);
            }
        }
    },

    // 渲染左侧考点目录
    renderDirectory() {
        const directoryList = document.querySelector('.directory-list');
        if (!directoryList || !this.data) return;

        directoryList.innerHTML = this.data.categories.map(cat => `
            <li class="directory-item">
                <div class="directory-link" onclick="KnowledgeRenderer.selectCategory('${cat.id}', this)">
                    <span class="topic-name">${cat.name}</span>
                    <span class="topic-count">${cat.count}个知识点</span>
                </div>
            </li>
        `).join('');
    },

    // 选择考点分类
    selectCategory(categoryId, element) {
        document.querySelectorAll('.directory-link').forEach(l => l.classList.remove('active'));
        element.classList.add('active');

        const category = this.data.categories.find(c => c.id === categoryId);
        if (!category) return;

        this.currentCategory = category;
        this.showKnowledgeSection(category);
    },

    // 显示知识区域
    showKnowledgeSection(category) {
        const trendOverview = document.querySelector('.trend-overview');
        if (trendOverview) trendOverview.style.display = 'none';
        document.querySelector('.knowledge-section').classList.add('active');

        // 重置串讲和分析区块显示状态（修复切换考点后不显示的bug）
        const chainSummary = document.getElementById('chainSummary');
        const examPointsCard = document.getElementById('examPointsCard');
        if (chainSummary) chainSummary.style.display = 'block';
        if (examPointsCard) examPointsCard.style.display = 'block';

        // 渲染知识图谱
        this.renderKnowledgeGraph(category);

        // 渲染知识串讲
        this.renderKnowledgeChain(category);

        // 渲染考点分析表格
        this.renderExamPoints(category);

        // 隐藏知识点精讲
        document.getElementById('knowledgeDetailSection').style.display = 'none';
    },

    // 渲染知识图谱（网格布局，显示所有知识点）
    renderKnowledgeGraph(category) {
        const diagramContainer = document.querySelector('.knowledge-diagram');
        if (!diagramContainer) return;

        document.querySelector('.graph-title').textContent = `🔗 ${category.name}知识图谱（共${category.topics.length}个知识点）`;

        const topics = category.topics;
        const colors = ['#d32f2f', '#1976d2', '#388e3c', '#ff9800', '#7b1fa2', '#00796b', '#c62828', '#1565c0'];

        // 根节点标题
        let treeHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="padding: 12px 25px; background: #d32f2f; color: #fff; border: 3px solid #b71c1c; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 2px 2px 0 rgba(211,47,47,0.3);">
                    ${category.name}
                </div>
            </div>
            <div style="width: 100%; height: 2px; background: #1976d2; margin-bottom: 12px;"></div>
        `;

        // 所有知识点网格布局
        treeHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; padding: 10px;">';
        topics.forEach((topic, i) => {
            const color = colors[i % colors.length];
            const isHighFreq = topic.tags?.includes('高频考点');
            treeHTML += `
                <div class="tree-node" onclick="KnowledgeRenderer.selectTopic('${topic.id}', this)"
                    style="padding: 8px 12px; background: rgba(${this.colorToRgba(color)},0.15); color: ${color}; border: 2px solid ${color}; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 16px; text-align: center; transition: all 0.3s;">
                    ${topic.name.length > 10 ? topic.name.substring(0, 10) + '...' : topic.name}
                    ${isHighFreq ? '<span style="background: #ff9800; color: #fff; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 2px;">⭐</span>' : ''}
                </div>
            `;
        });
        treeHTML += '</div>';

        // 图谱说明
        treeHTML += `
            <div style="text-align: center; margin-top: 12px; padding: 8px; background: rgba(255,255,255,0.8); border-radius: 5px; border: 2px solid rgba(0,0,0,0.1); font-size: 11px; color: #666;">
                <span style="margin-right: 15px;"><span style="background: #ff9800; color: #fff; padding: 2px 6px; border-radius: 4px;">⭐</span> 高频考点</span>
                <span style="color: #333; font-weight: 700;">点击节点查看知识点精讲 →</span>
            </div>
        `;

        diagramContainer.innerHTML = treeHTML;
    },

    // 颜色转换辅助函数
    colorToRgba(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    },

    // 渲染知识串讲
    renderKnowledgeChain(category) {
        const chainContent = document.getElementById('chainSummary');
        if (!chainContent) return;

        document.querySelector('.chain-title').textContent = `📖 ${category.name}知识串讲`;

        // 合并所有知识点的摘要
        const summaryText = category.topics.map(t => t.summary).join('\n\n');
        const keyPoints = category.topics.flatMap(t => t.keyPoints || []);

        chainContent.innerHTML = `
            <div class="chain-title">📖 ${category.name}知识串讲</div>
            <div style="background: rgba(255,255,255,0.5); padding: 12px; border-radius: 8px; line-height: 1.7; font-size: 15px;">
                ${category.topics.map((t, i) => `
                    <p><strong>${i + 1}. ${t.name}</strong></p>
                    <p>${t.summary}</p>
                `).join('\n')}
                <p style="margin-top: 10px; padding: 8px; background: rgba(255,152,0,0.1); border-radius: 5px; border-left: 3px solid #ff9800; font-size: 16px;">
                    <strong>💡 备考要点：</strong>①掌握核心概念 → ②理解关键原理 → ③识别易错点 → ④真题反复演练
                </p>
            </div>
        `;
    },

    // 渲染考点分析表格
    renderExamPoints(category) {
        const table = document.querySelector('.exam-points-table tbody');
        if (!table) return;

        document.querySelector('.exam-points-title').textContent = `📊 ${category.name}常见考点分析`;

        table.innerHTML = category.topics.map(t => `
            <tr>
                <td><strong>${t.name}</strong></td>
                <td>${t.tags?.includes('高频考点') ? '高频（每年必考）' : '中频（近3年考2-3次）'}</td>
                <td>2025/2024/2023</td>
                <td>选择题、案例分析</td>
                <td>中等</td>
            </tr>
        `).join('');
    },

    // 选择知识点（显示精讲）
    selectTopic(topicId, element) {
        document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active'));
        if (element) {
            element.classList.add('active');
            element.style.transform = 'scale(1.05)';
            element.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        }

        // 查找知识点
        let topic = null;
        for (const cat of this.data.categories) {
            topic = cat.topics.find(t => t.id === topicId);
            if (topic) break;
        }

        if (!topic) return;

        // 隐藏串讲和考点分析，显示精讲
        document.getElementById('chainSummary').style.display = 'none';
        document.getElementById('examPointsCard').style.display = 'none';
        document.getElementById('knowledgeDetailSection').style.display = 'block';

        this.renderTopicDetail(topic);
    },

    // 渲染知识点精讲详情
    renderTopicDetail(topic) {
        const detailSection = document.getElementById('knowledgeDetailSection');
        if (!detailSection) return;

        document.querySelector('.detail-title').textContent = topic.name;

        let html = `
            <div class="detail-card">
                <div class="detail-header">
                    <div class="detail-title">${topic.name}</div>
                    <div class="detail-tags">
                        ${topic.tags?.map(tag => `<span class="detail-tag ${this.getTagColor(tag)}">${tag}</span>`).join('') || ''}
                    </div>
                </div>
                <div class="content-section">
                    <div class="section-title blue">核心定义与概念讲解</div>
                    <div class="section-content">
                        <p>${topic.coreDefinition || topic.summary}</p>
                        ${topic.keyPoints && topic.keyPoints.length > 0 ? `
                            <ul style="margin-top: 10px; margin-left: 20px;">
                                ${topic.keyPoints.map(kp => {
                                    // 支持字符串和对象两种格式
                                    if (typeof kp === 'string') {
                                        return `<li style="margin-bottom: 5px;"><span style="color: #1976d2;">◆</span> ${kp}</li>`;
                                    } else {
                                        return `<li><span style="color: ${kp.color || '#1976d2'};">${kp.name}</span>：${kp.desc}
                                            ${kp.examples ? `（如：${kp.examples.join('、')}）` : ''}
                                        </li>`;
                                    }
                                }).join('')}
                            </ul>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- 易错点 -->
            <div class="error-points-card">
                <div class="section-title red">易错点与注意事项</div>
                <div class="error-grid">
                    ${(topic.errorPoints && topic.errorPoints.length > 0) ? topic.errorPoints.map(err => {
                        // 支持字符串和对象两种格式
                        if (typeof err === 'string') {
                            return `<div class="error-card">
                                <div class="error-icon">⚠️</div>
                                <div class="error-title">${err}</div>
                                <div class="error-correct">✓ 注意避免此错误</div>
                            </div>`;
                        } else {
                            return `<div class="error-card">
                                <div class="error-icon">❌</div>
                                <div class="error-title">${err.wrong || '错误认知'}</div>
                                <div class="error-correct">✓ ${err.correct || '正确认知'}</div>
                            </div>`;
                        }
                    }).join('') : `
                        <div class="error-card">
                            <div class="error-icon">💡</div>
                            <div class="error-title">暂无易错点记录</div>
                            <div class="error-correct">建议结合真题练习总结易错点</div>
                        </div>
                    `}
                </div>
            </div>

            <!-- 真题示例 -->
            ${topic.questions && topic.questions.length > 0 ? `
                <div class="example-card">
                    <div class="section-title green">真题示例练习</div>
                    ${topic.questions.map(q => {
                        // 支持两种格式：完整真题格式和简单问答格式
                        if (q.q && q.a) {
                            // 简单问答格式
                            return `<div style="margin: 15px 0; padding: 15px; background: rgba(56,142,60,0.1); border-radius: 8px; border-left: 3px solid #388e3c;">
                                <div style="font-weight: 700; color: #388e3c; margin-bottom: 10px;">❓ ${q.q}</div>
                                <div style="padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px;">
                                    <strong style="color: #1976d2;">✓ 答案：</strong>${q.a}
                                </div>
                            </div>`;
                        } else if (q.text && q.options) {
                            // 完整真题格式
                            return `<div class="example-question">
                                <div class="question-header">${q.year || '2025'}年${q.semester || ''}真题 ${q.number ? `第${q.number}题` : ''}</div>
                                <div class="question-text">${q.text}</div>
                                <div class="question-options">
                                    ${q.options.map(opt => `
                                        <div class="option-item" onclick="selectOption(this, '${opt.label}', '${opt.correct ? 'correct' : 'wrong'}')">
                                            <span class="option-label">${opt.label}.</span>${opt.text}
                                        </div>
                                    `).join('')}
                                </div>
                                <button class="show-answer-btn" onclick="toggleAnswer(this)">📖 查看答案与解析</button>
                                <div class="answer-section">
                                    <div class="answer-box">
                                        <div class="answer-label">✓ 正确答案：${q.options.find(o => o.correct)?.label || 'A'}</div>
                                        <div class="answer-text"><strong>解析：</strong>${q.analysis || '详见教材'}</div>
                                    </div>
                                </div>
                            </div>`;
                        }
                        return '';
                    }).join('')}
                </div>
            ` : ''}

            <!-- 替代字段渲染 -->
            ${this.renderAlternativeFields(topic)}

            <!-- 扩展知识 -->
            <div class="related-card">
                <div class="section-title blue">扩展知识与关联链接</div>
                <div class="related-links">
                    ${(topic.relatedLinks && topic.relatedLinks.length > 0) ? topic.relatedLinks.map(link => `
                        <div class="related-link" onclick="KnowledgeRenderer.navigateToRelated('${link}')">→ ${link}</div>
                    `).join('') : `
                        <div class="related-link">→ 建议查阅相关教材章节</div>
                        <div class="related-link">→ 结合真题练习加深理解</div>
                    `}
                </div>
            </div>

            <button class="back-btn" onclick="KnowledgeRenderer.backToCategory()">← 返回考点总览</button>
        `;

        detailSection.innerHTML = html;
    },

    // 获取标签颜色
    getTagColor(tag) {
        if (tag.includes('高频')) return 'red';
        if (tag.includes('必学')) return 'blue';
        if (tag.includes('近')) return 'orange';
        return 'blue';
    },

    // 渲染替代字段（支持styles、qualities、steps等）
    renderAlternativeFields(topic) {
        let html = '';

        // 架构风格分类
        if (topic.styles && topic.styles.length > 0) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title blue">架构风格分类</div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                        ${topic.styles.map(s => `
                            <div style="padding: 12px; background: rgba(25,118,210,0.1); border-radius: 8px; border-left: 3px solid #1976d2;">
                                <strong style="color: #1976d2;">${s.name || '风格名称'}</strong>
                                <p style="font-size: 16px; margin-top: 5px;">${s.desc || '风格描述'}</p>
                                ${s.constraint ? `<p style="font-size: 15px; color: #ff9800;">约束：${s.constraint}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 质量属性
        if (topic.qualities && topic.qualities.length > 0) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title orange">架构质量属性</div>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: rgba(255,152,0,0.1);">
                                <th style="padding: 10px; border-bottom: 2px solid #ff9800; text-align: left;">属性</th>
                                <th style="padding: 10px; border-bottom: 2px solid #ff9800; text-align: left;">定义</th>
                                <th style="padding: 10px; border-bottom: 2px solid #ff9800; text-align: left;">提升策略</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topic.qualities.map(q => `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);"><strong>${q.name || '质量属性'}</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">${q.desc || '属性描述'}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">${(q.tactics && q.tactics.length > 0) ? q.tactics.join(', ') : '详见专业资料'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // 步骤流程
        if (topic.steps && topic.steps.length > 0) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title green">方法步骤</div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                        ${topic.steps.map((s, i) => `
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 30px; height: 30px; background: #388e3c; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">${s.step || (i + 1)}</div>
                                <div style="padding: 10px 15px; background: rgba(56,142,60,0.1); border-radius: 8px; flex: 1;">
                                    <strong style="color: #388e3c;">${s.name || '步骤名称'}</strong>
                                    <p style="font-size: 16px; margin-top: 3px;">${s.desc || '步骤描述'}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 方法列表
        if (topic.methods && topic.methods.length > 0) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title blue">方法对比</div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                        ${topic.methods.map(m => `
                            <div style="padding: 12px; background: rgba(25,118,210,0.1); border-radius: 8px; border-left: 3px solid #1976d2;">
                                <strong style="color: #1976d2;">${m.name || '方法名称'}</strong>
                                <p style="font-size: 16px; margin-top: 5px;">${m.desc || '方法描述'}</p>
                                ${m.pros ? `<p style="font-size: 15px; color: #388e3c;">优点：${m.pros}</p>` : ''}
                                ${m.cons ? `<p style="font-size: 15px; color: #d32f2f;">缺点：${m.cons}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 阶段列表
        if (topic.phases) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title orange">阶段划分</div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                        ${topic.phases.map((p, i) => `
                            <div style="padding: 10px 15px; background: rgba(255,152,0,${0.1 + i * 0.05}); border-radius: 8px; border-left: 3px solid #ff9800;">
                                <strong style="color: #ff9800;">阶段${i + 1}：${p.name || p.phase || '阶段'}</strong>
                                <p style="font-size: 15px; margin-top: 3px;">${p.desc || p.description || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 分类列表
        if (topic.categories) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title purple">分类体系</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
                        ${topic.categories.map(c => `
                            <div style="padding: 10px; background: rgba(123,31,162,0.1); border-radius: 8px; text-align: center; border: 2px solid rgba(123,31,162,0.3);">
                                <strong style="color: #7b1fa2;">${c.name || c.category || '分类'}</strong>
                                <p style="font-size: 16px; color: #666; margin-top: 5px;">${c.desc || c.description || (c.count ? c.count + '种' : '')}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // CAP定理
        if (topic.cap && topic.base) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title red">CAP与BASE定理</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                        <div style="padding: 15px; background: rgba(211,47,47,0.1); border-radius: 8px;">
                            <h4 style="color: #d32f2f; margin-bottom: 10px;">CAP定理</h4>
                            <p><strong>C（一致性）</strong>：${topic.cap.consistency}</p>
                            <p><strong>A（可用性）</strong>：${topic.cap.availability}</p>
                            <p><strong>P（分区容错）</strong>：${topic.cap.partition}</p>
                            <p style="margin-top: 10px; font-size: 16px; background: rgba(255,255,255,0.5); padding: 8px; border-radius: 5px;">${topic.cap.conclusion}</p>
                        </div>
                        <div style="padding: 15px; background: rgba(56,142,60,0.1); border-radius: 8px;">
                            <h4 style="color: #388e3c; margin-bottom: 10px;">BASE理论</h4>
                            <p><strong>B（基本可用）</strong>：${topic.base.basicallyAvailable}</p>
                            <p><strong>S（软状态）</strong>：${topic.base.softState}</p>
                            <p><strong>E（最终一致）</strong>：${topic.base.eventuallyConsistent}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // 算法对比
        if (topic.algorithms && topic.algorithms.length > 0) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title blue">算法对比</div>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: rgba(25,118,210,0.1);">
                                <th style="padding: 10px; border-bottom: 2px solid #1976d2;">算法</th>
                                <th style="padding: 10px; border-bottom: 2px solid #1976d2;">类型</th>
                                <th style="padding: 10px; border-bottom: 2px solid #1976d2;">特点</th>
                                <th style="padding: 10px; border-bottom: 2px solid #1976d2;">适用场景</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topic.algorithms.map(a => `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);"><strong>${a.name || '算法名称'}</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">${a.type || '类型'}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">${a.feature || '特点'}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">${a.scene || '场景'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // 实现方案
        if (topic.implementations) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title green">实现方案</div>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                        ${topic.implementations.map(impl => `
                            <div style="padding: 12px; background: rgba(56,142,60,0.1); border-radius: 8px; border-left: 3px solid #388e3c;">
                                <strong style="color: #388e3c;">${impl.name || impl.implementation || '方案'}</strong>
                                <p style="font-size: 15px; margin-top: 5px;">${impl.desc || impl.description || ''}</p>
                                ${impl.pros ? `<p style="font-size: 16px; color: #388e3c;">优点：${impl.pros}</p>` : ''}
                                ${impl.cons ? `<p style="font-size: 16px; color: #d32f2f;">缺点：${impl.cons}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 组件架构
        if (topic.components) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title orange">核心组件</div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                        ${topic.components.map(c => `
                            <div style="padding: 12px; background: rgba(255,152,0,0.1); border-radius: 8px; border-left: 3px solid #ff9800;">
                                <strong style="color: #ff9800;">${c.name || c.component || '组件'}</strong>
                                <p style="font-size: 15px; margin-top: 5px;">${c.desc || c.description || ''}</p>
                                ${c.responsibilities ? `<p style="font-size: 16px; color: #666;">职责：${c.responsibilities.join(', ')}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 策略方案
        if (topic.strategies) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title blue">策略方案</div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                        ${topic.strategies.map(s => `
                            <div style="padding: 10px 15px; background: rgba(25,118,210,0.1); border-radius: 8px; border-left: 3px solid #1976d2;">
                                <strong style="color: #1976d2;">${s.strategy || s.name || '策略'}</strong>
                                <p style="font-size: 15px; margin-top: 3px;">${s.desc || ''}</p>
                                ${s.example ? `<p style="font-size: 16px; color: #666;">示例：${s.example}</p>` : ''}
                                ${s.advantages ? `<p style="font-size: 16px; color: #388e3c;">优点：${s.advantages}</p>` : ''}
                                ${s.when ? `<p style="font-size: 16px; color: #666;">适用：${s.when}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 原则列表
        if (topic.principles) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title orange">核心原则</div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                        ${topic.principles.map(p => `
                            <div style="padding: 10px 15px; background: rgba(255,152,0,0.1); border-radius: 8px; border-left: 3px solid #ff9800;">
                                <strong style="color: #ff9800;">${p.principle || p.name || '原则'}</strong>
                                <p style="font-size: 15px; margin-top: 3px;">${p.desc || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 拆分指导
        if (topic.splittingGuidelines) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title green">拆分指导</div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                        ${topic.splittingGuidelines.map(g => `
                            <div style="padding: 10px 15px; background: rgba(56,142,60,0.1); border-radius: 8px; border-left: 3px solid #388e3c;">
                                <strong style="color: #388e3c;">${g.guideline || g.name || '指导'}</strong>
                                <p style="font-size: 15px; margin-top: 3px;">${g.desc || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 分片键
        if (topic.shardingKeys) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title green">分片键选择</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                        ${topic.shardingKeys.map(k => `
                            <div style="padding: 10px 20px; background: rgba(56,142,60,0.1); border-radius: 8px; border: 2px solid rgba(56,142,60,0.3);">
                                <strong style="color: #388e3c;">${k}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 缓存类型
        if (topic.cacheTypes) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title purple">缓存类型</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
                        ${topic.cacheTypes.map(c => `
                            <div style="padding: 10px; background: rgba(123,31,162,0.1); border-radius: 8px; text-align: center; border: 2px solid rgba(123,31,162,0.3);">
                                <strong style="color: #7b1fa2;">${c.name || c.type || '缓存类型'}</strong>
                                <p style="font-size: 16px; color: #666; margin-top: 5px;">${c.desc || c.description || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 缓存问题
        if (topic.cacheProblems) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title red">缓存问题与解决方案</div>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: rgba(211,47,47,0.1);">
                                <th style="padding: 10px; border-bottom: 2px solid #d32f2f;">问题</th>
                                <th style="padding: 10px; border-bottom: 2px solid #d32f2f;">原因</th>
                                <th style="padding: 10px; border-bottom: 2px solid #d32f2f;">解决方案</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topic.cacheProblems.map(p => `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);"><strong>${p.name || p.problem || '问题'}</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">${p.reason || p.cause || ''}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">${p.solution?.join(', ') || p.solution || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // 协议层
        if (topic.layers) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title blue">协议层级</div>
                    <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 10px;">
                        ${topic.layers.map((l, i) => `
                            <div style="padding: 10px; background: rgba(25,118,210,${0.2 - i * 0.03}); border-radius: 8px; display: flex; justify-content: space-between;">
                                <strong style="color: #1976d2;">${l.name || l.layer || '层级'}</strong>
                                <span style="font-size: 15px;">${l.desc || l.description || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 类型列表
        if (topic.types) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title orange">类型分类</div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                        ${topic.types.map(t => `
                            <div style="padding: 12px; background: rgba(255,152,0,0.1); border-radius: 8px; border-left: 3px solid #ff9800;">
                                <strong style="color: #ff9800;">${t.name || t.type || '类型'}</strong>
                                <p style="font-size: 15px; margin-top: 5px;">${t.desc || t.description || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 高可用策略
        if (topic.tactics) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title green">高可用策略</div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                        ${topic.tactics.map(t => `
                            <div style="padding: 10px 15px; background: rgba(56,142,60,0.1); border-radius: 8px; border-left: 3px solid #388e3c;">
                                <strong style="color: #388e3c;">${t.name || t.tactic || '策略'}</strong>
                                <p style="font-size: 15px; margin-top: 3px;">${t.desc || t.description || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 指标体系
        if (topic.metrics) {
            html += `
                <div class="detail-card" style="margin-top: 15px;">
                    <div class="section-title purple">指标体系</div>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: rgba(123,31,162,0.1);">
                                <th style="padding: 10px; border-bottom: 2px solid #7b1fa2;">指标</th>
                                <th style="padding: 10px; border-bottom: 2px solid #7b1fa2;">含义</th>
                                <th style="padding: 10px; border-bottom: 2px solid #7b1fa2;">计算</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topic.metrics.map(m => `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);"><strong>${m.name || m.metric || '指标'}</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">${m.desc || m.description || ''}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">${m.formula || m.calculation || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        return html;
    },

    // 返回考点总览
    backToCategory() {
        document.getElementById('chainSummary').style.display = 'block';
        document.getElementById('examPointsCard').style.display = 'block';
        document.getElementById('knowledgeDetailSection').style.display = 'none';
    },

    // 从URL参数选择知识点（用于首页跳转）
    selectTopicFromUrl(topicId) {
        if (!this.data) return;

        // 查找知识点所属分类
        for (const cat of this.data.categories) {
            const topic = cat.topics.find(t => t.id === topicId);
            if (topic) {
                // 先选中分类
                const catLink = document.querySelector('.directory-link');
                if (catLink) {
                    this.selectCategory(cat.id, catLink);
                }
                // 然后选中知识点
                setTimeout(() => {
                    this.selectTopic(topicId, null);
                }, 200);
                return;
            }
        }
        // 如果找不到指定知识点，默认选中第一个分类
        const firstLink = document.querySelector('.directory-link');
        if (firstLink && this.data.categories.length > 0) {
            this.selectCategory(this.data.categories[0].id, firstLink);
        }
    },

    // 导航到关联知识点
    navigateToRelated(linkName) {
        if (!this.data) return;
        // 尝试根据名称匹配知识点
        for (const cat of this.data.categories) {
            const topic = cat.topics.find(t => t.name.includes(linkName) || linkName.includes(t.name));
            if (topic) {
                this.selectTopic(topic.id, null);
                return;
            }
        }
        // 未找到则提示
        alert('相关知识点：' + linkName + '\n请在左侧目录中查找对应考点');
    }
};

// ==================== 真题模块渲染 ====================
const QuestionsRenderer = {
    data: null,
    currentFilters: { year: 'all', topic: 'all', difficulty: 'all', type: 'choice' },

    async init() {
        this.data = await loadJSON('data/questions.json');
        if (!this.data) return;
        this.renderFilters();
        this.renderQuestions();
    },

    // 渲染筛选器
    renderFilters() {
        // 年份筛选
        const yearSection = document.querySelector('.filter-section:nth-child(1) .filter-options');
        if (yearSection && this.data.years) {
            yearSection.innerHTML = this.data.years.map(ys => `
                <div class="filter-option" onclick="QuestionsRenderer.filterYear('${ys.id}', this)">
                    ${ys.name} <span class="filter-count">(${ys.count}题)</span>
                </div>
            `).join('');
        }

        // 考点筛选
        const topicSection = document.querySelector('.filter-section:nth-child(2) .filter-options');
        if (topicSection && this.data.topics) {
            topicSection.innerHTML = this.data.topics.map(ts => `
                <div class="filter-option" onclick="QuestionsRenderer.filterTopic('${ts.id}', this)">
                    ${ts.name} <span class="filter-count">(${ts.count}题)</span>
                </div>
            `).join('');
        }
    },

    // 渲染真题列表
    renderQuestions() {
        const questionsArea = document.querySelector('.questions-area');
        if (!questionsArea || !this.data) return;

        // 先渲染统计栏
        const statsBar = questionsArea.querySelector('.stats-bar .stats-text');
        if (statsBar) {
            statsBar.textContent = `当前筛选：${this.currentFilters.year === 'all' ? '全部年份' : this.currentFilters.year + '年'} ${this.currentFilters.type === 'choice' ? '选择题' : '案例分析'} · 共${this.data.questions.length}题`;
        }

        // 渲染真题卡片
        const existingCards = questionsArea.querySelectorAll('.question-card');
        existingCards.forEach(card => card.remove());

        // 插入新卡片
        this.data.questions.forEach((q, index) => {
            const card = this.createQuestionCard(q, index);
            questionsArea.insertBefore(card, questionsArea.querySelector('.stats-bar').nextSibling);
        });
    },

    // 创建真题卡片
    createQuestionCard(q, index) {
        const card = document.createElement('div');
        card.className = `question-card ${q.type}`;
        card.dataset.year = q.year;
        card.dataset.topic = q.topic;
        card.dataset.difficulty = q.difficulty;
        card.dataset.type = q.type;

        // 获取考点名称
        const topicData = this.data.topics?.find(t => t.id === q.topic);
        const topicName = topicData?.name || q.topic;
        const topicClass = {
            'arch': 'arch',
            'dist': 'dist',
            'db': 'db',
            'network': 'net',
            'security': 'sec'
        }[q.topic] || 'arch';

        if (q.type === 'choice') {
            card.innerHTML = `
                <div class="question-header">
                    <div class="question-meta">
                        <div class="question-number">第${q.number}题</div>
                        <div class="year-tag">${q.year}${q.semester}</div>
                        <div class="topic-tag ${topicClass}">${topicName}</div>
                        <div class="question-type-badge">选择题</div>
                    </div>
                    <div class="question-status">
                        <div class="question-difficulty ${q.difficulty}">${q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}</div>
                        <div class="status-btn mark" onclick="toggleStatus(this)">📌 标记</div>
                        <div class="status-btn collect" onclick="toggleStatus(this)">⭐ 收藏</div>
                    </div>
                </div>
                <div class="question-content">
                    <div class="question-text">${q.text}</div>
                    <div class="choice-options">
                        ${q.options.map(opt => `
                            <div class="choice-option" onclick="selectOption(this, '${opt.label}', '${opt.label === q.answer ? 'correct' : 'wrong'}')">
                                <span class="option-label">${opt.label}.</span>${opt.text}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button class="show-answer-btn" onclick="toggleAnswer(this)">📖 查看答案与解析</button>
                <div class="answer-section">
                    <div class="answer-box">
                        <div class="answer-header">
                            <div class="answer-label">正确答案</div>
                            <div class="answer-badge">${q.answer}</div>
                        </div>
                        <div class="analysis-box">
                            <div class="analysis-title">解析说明</div>
                            <div class="analysis-text">
                                <p><strong>知识点：${q.analysis?.keyPoint || q.subTopic}</strong></p>
                                <p style="margin-top:5px;">${q.analysis?.explanation || ''}</p>
                                ${q.analysis?.optionAnalysis ? `
                                    <p style="margin-top:8px;"><strong>选项分析：</strong></p>
                                    ${q.analysis.optionAnalysis.map(oa => `<p>• ${oa}</p>`).join('')}
                                ` : ''}
                            </div>
                        </div>
                        ${q.relatedKnowledge ? `
                            <div class="related-points">
                                ${q.relatedKnowledge.map(rp => `<div class="related-link">→ ${rp}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else if (q.type === 'case') {
            card.innerHTML = `
                <div class="question-header">
                    <div class="question-meta">
                        <div class="question-number">案例分析题${q.number}</div>
                        <div class="year-tag">${q.year}${q.semester}</div>
                        <div class="topic-tag ${topicClass}">${topicName}</div>
                        <div class="question-type-badge">案例分析</div>
                    </div>
                    <div class="question-status">
                        <div class="question-difficulty ${q.difficulty}">${q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}</div>
                        <div class="status-btn mark" onclick="toggleStatus(this)">📌 标记</div>
                    </div>
                </div>
                <div class="question-content">
                    <div class="question-text"><strong>题目要求：</strong>${q.text}</div>
                    ${q.scenario ? `
                        <div class="case-scenario">
                            <div class="case-scenario-title">📋 场景背景</div>
                            <div class="case-scenario-text">${q.scenario}</div>
                        </div>
                    ` : ''}
                </div>
                <button class="show-answer-btn" onclick="toggleAnswer(this)">📖 查看答案与解析</button>
                <div class="answer-section">
                    <div class="answer-box">
                        <div class="answer-header">
                            <div class="answer-label">参考答案</div>
                        </div>
                        ${q.subQuestions ? q.subQuestions.map(sq => `
                            <div class="analysis-box">
                                <div class="analysis-title">${sq.question}</div>
                                <div class="analysis-text">${sq.answer}</div>
                            </div>
                        `).join('') : `<div class="analysis-box"><div class="analysis-title">参考答案</div><div class="analysis-text">${q.analysis?.explanation || ''}</div></div>`}
                        ${q.relatedKnowledge ? `
                            <div class="related-points">
                                ${q.relatedKnowledge.map(rp => `<div class="related-link">→ ${rp}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        return card;
    },

    // 筛选年份
    filterYear(year, element) {
        document.querySelectorAll('.filter-section:nth-child(1) .filter-option').forEach(o => o.classList.remove('active'));
        element.classList.add('active');
        this.currentFilters.year = year;
        this.filterQuestions();
    },

    // 筛选考点
    filterTopic(topic, element) {
        document.querySelectorAll('.filter-section:nth-child(2) .filter-option').forEach(o => o.classList.remove('active'));
        element.classList.add('active');
        this.currentFilters.topic = topic;
        this.filterQuestions();
    },

    // 筛选难度
    filterDifficulty(diff, element) {
        element.classList.toggle('active');
        // 多选难度
        this.filterQuestions();
    },

    // 筛选题型
    filterType(type, element) {
        document.querySelectorAll('.filter-section:last-child .filter-option').forEach(o => o.classList.remove('active'));
        element.classList.add('active');
        this.currentFilters.type = type;
        this.filterQuestions();
    },

    // 执行筛选
    filterQuestions() {
        const cards = document.querySelectorAll('.question-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const yearMatch = this.currentFilters.year === 'all' || card.dataset.year === this.currentFilters.year;
            const topicMatch = this.currentFilters.topic === 'all' || card.dataset.topic === this.currentFilters.topic;
            const typeMatch = this.currentFilters.type === 'all' || card.dataset.type === this.currentFilters.type;

            if (yearMatch && topicMatch && typeMatch) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        const statsText = document.querySelector('.stats-bar .stats-text');
        if (statsText) {
            const yearName = this.currentFilters.year === 'all' ? '全部年份' : this.data.years?.find(y => y.id === this.currentFilters.year)?.name || this.currentFilters.year;
            const typeName = this.currentFilters.type === 'choice' ? '选择题' : this.currentFilters.type === 'case' ? '案例分析' : '全部题型';
            statsText.textContent = `当前筛选：${yearName} ${typeName} · 共${visibleCount}题`;
        }
    }
};

// ==================== 模拟考试渲染 ====================
const ExamRenderer = {
    data: null,
    currentQuestion: 1,
    answers: {},
    markedQuestions: [],
    timeRemaining: 150 * 60, // 150分钟（秒）
    timerInterval: null,

    // 随机抽取算法（Fisher-Yates洗牌）
    selectQuestionsByDistribution() {
        const allQuestions = this.data.questions;
        const examQuestions = this.data.config.examQuestions || 75;

        // 按主题分组
        const topicGroups = {};
        allQuestions.forEach(q => {
            const topic = q.topic || '其他';
            if (!topicGroups[topic]) topicGroups[topic] = [];
            topicGroups[topic].push(q);
        });

        // 定义主题抽取比例
        const distribution = {
            '系统架构': 18, '分布式系统': 15, '数据库架构': 12,
            '计算机网络': 10, '信息安全': 8, '软件工程': 6,
            '系统可靠性': 4, '项目管理': 2
        };

        const selected = [];
        const topics = Object.keys(distribution);

        // 按比例抽取
        topics.forEach(topic => {
            const pool = topicGroups[topic] || [];
            const count = Math.min(distribution[topic], pool.length);

            // Fisher-Yates部分洗牌
            for (let i = pool.length - 1; i > 0 && selected.length < count; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            selected.push(...pool.slice(0, count));
        });

        // 如果不够，从剩余题目补充
        if (selected.length < examQuestions) {
            const remaining = allQuestions.filter(q => !selected.includes(q));
            const need = examQuestions - selected.length;
            for (let i = remaining.length - 1; i > 0 && need > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
            }
            selected.push(...remaining.slice(0, need));
        }

        // 重新编号为1-75
        selected.forEach((q, i) => q.id = i + 1);
        this.data.questions = selected;
        this.data.config.totalQuestions = selected.length;
    },

    async init() {
        this.data = await loadJSON('data/exam.json');
        if (!this.data) return;

        // 随机抽取75题
        this.selectQuestionsByDistribution();

        // 初始化考试状态
        this.currentQuestion = 1;
        this.answers = {};
        this.markedQuestions = [];
        this.timeRemaining = this.data.config.timeLimit * 60;

        this.generateQuestionGrid();
        this.updateProgress();
        this.startTimer();
        this.loadQuestion(1);
    },

    // 生成答题卡网格
    generateQuestionGrid() {
        const grid = document.getElementById('questionGrid');
        if (!grid) return;

        grid.innerHTML = '';
        for (let i = 1; i <= this.data.config.totalQuestions; i++) {
            const item = document.createElement('div');
            item.className = 'grid-item';
            if (i === this.currentQuestion) item.classList.add('current');
            item.textContent = i;
            item.onclick = () => this.goToQuestion(i);
            grid.appendChild(item);
        }
    },

    // 加载题目
    loadQuestion(qNum) {
        const q = this.data.questions.find(q => q.id === qNum);
        if (!q) return;

        this.currentQuestion = qNum;
        document.getElementById('currentNum').textContent = qNum;
        document.getElementById('qNum').textContent = qNum;
        document.getElementById('questionText').innerHTML = q.text;

        // 渲染选项
        const optionsList = document.getElementById('optionsList');
        optionsList.innerHTML = '';
        q.options.forEach((optText, idx) => {
            const label = ['A', 'B', 'C', 'D'][idx];
            const item = document.createElement('div');
            item.className = 'option-item';
            if (this.answers[qNum] === label) item.classList.add('selected');
            item.onclick = () => this.selectOption(item, label);
            item.innerHTML = `
                <div class="option-radio"></div>
                <div class="option-label">${label}</div>
                <div class="option-text">${optText}</div>
            `;
            optionsList.appendChild(item);
        });

        // 更新标记按钮
        const markBtn = document.getElementById('markBtn');
        if (this.markedQuestions.includes(qNum)) {
            markBtn.classList.add('active');
            markBtn.textContent = '📌 已标记';
        } else {
            markBtn.classList.remove('active');
            markBtn.textContent = '📌 标记此题';
        }

        this.updateGridItem(qNum);
    },

    // 选择答案
    selectOption(element, option) {
        document.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
        element.classList.add('selected');
        this.answers[this.currentQuestion] = option;
        this.updateProgress();
        this.updateGridItem(this.currentQuestion);
    },

    // 标记题目
    toggleMark() {
        const btn = document.getElementById('markBtn');
        const idx = this.markedQuestions.indexOf(this.currentQuestion);
        if (idx === -1) {
            this.markedQuestions.push(this.currentQuestion);
            btn.classList.add('active');
            btn.textContent = '📌 已标记';
        } else {
            this.markedQuestions.splice(idx, 1);
            btn.classList.remove('active');
            btn.textContent = '📌 标记此题';
        }
        this.updateProgress();
        this.updateGridItem(this.currentQuestion);
    },

    // 更新进度
    updateProgress() {
        const answered = Object.keys(this.answers).length;
        const marked = this.markedQuestions.length;
        const unanswered = this.data.config.totalQuestions - answered;

        document.getElementById('answeredCount').textContent = answered;
        document.getElementById('markedCount').textContent = marked;
        document.getElementById('unansweredCount').textContent = unanswered;

        const percent = (answered / this.data.config.totalQuestions) * 100;
        document.getElementById('progressFill').style.width = percent + '%';
        document.getElementById('progressText').textContent = answered + '/' + this.data.config.totalQuestions + ' 已答';
    },

    // 更新答题卡格子
    updateGridItem(qNum) {
        const items = document.querySelectorAll('.grid-item');
        items.forEach(item => {
            const num = parseInt(item.textContent);
            item.classList.remove('current', 'answered', 'marked');
            if (num === this.currentQuestion) item.classList.add('current');
            if (this.answers[num]) item.classList.add('answered');
            if (this.markedQuestions.includes(num)) item.classList.add('marked');
        });
    },

    // 导航题目
    prevQuestion() {
        if (this.currentQuestion > 1) {
            this.loadQuestion(this.currentQuestion - 1);
        }
    },

    nextQuestion() {
        if (this.currentQuestion < this.data.config.totalQuestions) {
            this.loadQuestion(this.currentQuestion + 1);
        }
    },

    goToQuestion(qNum) {
        this.loadQuestion(qNum);
    },

    // 计时器
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                clearInterval(this.timerInterval);
                this.submitExam();
            }
        }, 1000);
    },

    updateTimerDisplay() {
        const hours = Math.floor(this.timeRemaining / 3600);
        const minutes = Math.floor((this.timeRemaining % 3600) / 60);
        const seconds = this.timeRemaining % 60;

        const display = document.getElementById('timerDisplay');
        display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // 时间警告样式
        if (this.timeRemaining <= 600) {
            display.classList.add('danger');
            display.classList.remove('warning');
        } else if (this.timeRemaining <= 1800) {
            display.classList.add('warning');
            display.classList.remove('danger');
        } else {
            display.classList.remove('warning', 'danger');
        }
    },

    // 交卷
    submitExam() {
        clearInterval(this.timerInterval);

        // 计算成绩
        let correct = 0;
        this.data.questions.forEach(q => {
            if (this.answers[q.id] === q.answer) {
                correct++;
            }
        });

        const wrong = this.data.config.totalQuestions - correct;
        const score = correct;

        // 显示结果
        document.getElementById('examPage').style.display = 'none';
        document.getElementById('resultPage').classList.add('active');

        document.getElementById('scoreDisplay').textContent = score;
        document.getElementById('correctCount').textContent = correct;
        document.getElementById('wrongCount').textContent = wrong;

        const usedSeconds = (this.data.config.timeLimit * 60) - this.timeRemaining;
        const usedHours = Math.floor(usedSeconds / 3600);
        const usedMinutes = Math.floor((usedSeconds % 3600) / 60);
        const usedSecondsRemaining = usedSeconds % 60;
        document.getElementById('usedTime').textContent = `${usedHours.toString().padStart(2, '0')}:${usedMinutes.toString().padStart(2, '0')}:${usedSecondsRemaining.toString().padStart(2, '0')}`;

        // 生成回顾列表
        this.generateReviewList();
    },

    // 生成题目回顾列表
    generateReviewList() {
        const reviewList = document.getElementById('reviewList');
        if (!reviewList) return;

        reviewList.innerHTML = '';
        this.data.questions.forEach(q => {
            const userAnswer = this.answers[q.id] || '-';
            const isCorrect = userAnswer === q.answer;

            const item = document.createElement('div');
            item.className = `review-item ${isCorrect ? 'correct' : 'wrong'}`;
            item.innerHTML = `
                <div class="review-header">
                    <div class="review-number">第${q.id}题</div>
                    <div class="review-result">${isCorrect ? '✓ 正确' : '✗ 错误'}</div>
                </div>
                <div class="review-answer">你的答案：${userAnswer} | 正确答案：${q.answer}</div>
            `;
            reviewList.appendChild(item);
        });
    },

    // 筛选回顾
    filterReview(type, element) {
        document.querySelectorAll('.review-tab').forEach(tab => tab.classList.remove('active'));
        element.classList.add('active');

        document.querySelectorAll('.review-item').forEach(item => {
            if (type === 'all') item.style.display = 'block';
            else if (type === 'correct') item.style.display = item.classList.contains('correct') ? 'block' : 'none';
            else if (type === 'wrong') item.style.display = item.classList.contains('wrong') ? 'block' : 'none';
        });
    },

    // 重新考试
    restartExam() {
        this.currentQuestion = 1;
        this.answers = {};
        this.markedQuestions = [];
        this.timeRemaining = this.data.config.timeLimit * 60;

        document.getElementById('resultPage').classList.remove('active');
        document.getElementById('examPage').style.display = 'block';

        this.generateQuestionGrid();
        this.updateProgress();
        this.startTimer();
        this.loadQuestion(1);
    }
};

// ==================== 论文模块渲染 ====================
const EssayRenderer = {
    data: null,
    currentCategory: 'guide',

    async init() {
        this.data = await loadJSON('data/essays.json');
        if (!this.data) return;
        this.renderDirectory();
        this.renderWritingGuide();
    },

    // 渲染目录
    renderDirectory() {
        const topicList = document.querySelector('.topic-list');
        if (!topicList || !this.data.categories) return;

        topicList.innerHTML = `
            <li class="topic-item">
                <div class="topic-link active" onclick="EssayRenderer.selectCategory('guide', this)" style="border-color: #1976d2;">
                    <span class="topic-name" style="color: #1976d2;">✍️ 写作指南</span>
                    <span class="topic-count">框架·技巧</span>
                </div>
            </li>
            ${this.data.categories.map(cat => `
                <li class="topic-item">
                    <div class="topic-link" onclick="EssayRenderer.selectCategory('${cat.id}', this)">
                        <span class="topic-name">${cat.name}</span>
                        <span class="topic-count">${cat.count}篇范文</span>
                    </div>
                </li>
            `).join('')}
        `;
    },

    // 渲染写作指南
    renderWritingGuide() {
        const guideSection = document.querySelector('.writing-guide');
        if (!guideSection || !this.data.guide) return;

        // 框架模板已存在于HTML中，可补充动态内容
        const tipsCard = guideSection.querySelector('.tips-card .tips-grid');
        if (tipsCard && this.data.guide.writingTips) {
            tipsCard.innerHTML = this.data.guide.writingTips.map(tip => `
                <div class="tip-item">
                    <div class="tip-icon">${tip.icon}</div>
                    <div class="tip-title">${tip.title}</div>
                    <div class="tip-content">${tip.content}</div>
                </div>
            `).join('');
        }

        // 评分标准
        const scoringTable = guideSection.querySelector('.scoring-table tbody');
        if (scoringTable && this.data.guide.scoringCriteria) {
            scoringTable.innerHTML = this.data.guide.scoringCriteria.map(sc => `
                <tr>
                    <td>${sc.dimension}</td>
                    <td class="score-weight">${sc.weight}</td>
                    <td>${sc.points}</td>
                    <td>${sc.deduction}</td>
                </tr>
            `).join('');
        }

        // 项目素材
        const materialGrid = guideSection.querySelector('.material-grid');
        if (materialGrid && this.data.guide.materialSuggestions) {
            materialGrid.innerHTML = this.data.guide.materialSuggestions.map(mat => `
                <div class="material-item">
                    <div class="material-title">${mat.title}</div>
                    <div class="material-desc">${mat.desc}</div>
                </div>
            `).join('');
        }
    },

    // 选择分类
    selectCategory(categoryId, element) {
        document.querySelectorAll('.topic-link').forEach(l => l.classList.remove('active'));
        element.classList.add('active');
        this.currentCategory = categoryId;

        if (categoryId === 'guide') {
            document.querySelector('.writing-guide').classList.remove('hidden');
            document.querySelector('.essay-section').classList.remove('active');
        } else {
            document.querySelector('.writing-guide').classList.add('hidden');
            document.querySelector('.essay-section').classList.add('active');
            this.renderEssayList(categoryId);
        }
    },

    // 渲染范文列表
    renderEssayList(categoryId) {
        const essaySection = document.querySelector('.essay-section');
        if (!essaySection) return;

        const category = this.data.categories.find(c => c.id === categoryId);
        const essays = this.data.essays.filter(e => e.category === categoryId);

        const sectionTitle = document.getElementById('essaySectionTitle');
        if (sectionTitle) {
            sectionTitle.textContent = `📚 ${category?.name || categoryId}类范文`;
        }

        const essayCount = essaySection.querySelector('.essay-count');
        if (essayCount) {
            essayCount.textContent = `共${essays.length}篇范文`;
        }

        // 清除现有卡片
        const existingCards = essaySection.querySelectorAll('.essay-card');
        existingCards.forEach(card => card.remove());

        // 插入新卡片
        essays.forEach(essay => {
            const card = this.createEssayCard(essay);
            essaySection.appendChild(card);
        });
    },

    // 创建范文卡片
    createEssayCard(essay) {
        const card = document.createElement('div');
        card.className = `essay-card ${essay.level}`;
        card.onclick = () => this.toggleEssay(card);

        card.innerHTML = `
            <div class="essay-header">
                <div class="essay-title">${essay.title}</div>
                <div class="essay-badge">${essay.level === 'high' ? '高分范文 ⭐' : '参考范文'}</div>
            </div>
            <div class="essay-meta">
                <span>字数：${essay.wordCount}字</span>
                <span>评分：${essay.score}分</span>
                <span>主题：${essay.topic}</span>
            </div>
            <div class="essay-summary">${essay.summary}</div>
            <div class="essay-detail">
                <div class="essay-content-box">
                    ${essay.sections ? essay.sections.map(sec => `
                        <div class="essay-section-title">【${sec.title}】</div>
                        <div class="essay-content">${sec.content}</div>
                    `).join('') : ''}
                    ${essay.writingTips ? `
                        <div class="essay-section-title" style="margin-top:20px;">【写作要点】</div>
                        <div class="essay-content">${essay.writingTips.map(tip => `• ${tip}`).join('<br>')}</div>
                    ` : ''}
                </div>
                <div class="essay-actions">
                    <div class="action-btn collect" onclick="EssayRenderer.collectEssay()">⭐ 收藏范文</div>
                    <div class="action-btn copy" onclick="EssayRenderer.copyEssay()">📋 复制全文</div>
                </div>
            </div>
        `;

        return card;
    },

    // 展开/收起范文
    toggleEssay(card) {
        card.classList.toggle('expanded');
    },

    // 收藏范文
    collectEssay() {
        alert('范文已收藏到您的收藏库');
    },

    // 复制范文
    copyEssay() {
        alert('范文内容已复制到剪贴板');
    }
};

// ==================== 热力图渲染 ====================
const HeatmapRenderer = {
    data: null,
    currentYear: 'all',

    async init() {
        this.data = await loadJSON('data/heatmap.json');
        if (!this.data) return;
        this.renderTimeSelector();
        this.renderHeatmapGrid();
        this.renderBarChart();
        this.renderRankingTable();
        this.renderDifficultyStats();
        this.renderNewTrends();
        this.renderTrendLines();
    },

    // 渲染时间选择器
    renderTimeSelector() {
        const timeSelector = document.querySelector('.time-selector');
        if (!timeSelector || !this.data.yearRanges) return;

        timeSelector.innerHTML = this.data.yearRanges.map(yr => `
            <div class="time-btn ${yr.id === this.currentYear ? 'active' : ''}" onclick="HeatmapRenderer.selectYear('${yr.id}', this)">
                ${yr.name}
            </div>
        `).join('');
    },

    // 选择年份
    selectYear(year, element) {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        element.classList.add('active');
        this.currentYear = year;
        this.renderHeatmapGrid();
    },

    // 渲染热力图网格
    renderHeatmapGrid() {
        const heatmapGrid = document.querySelector('.heatmap-grid');
        if (!heatmapGrid || !this.data.heatmapPoints) return;

        // 根据年份筛选数据
        let filteredPoints = this.data.heatmapPoints;
        if (this.currentYear !== 'all') {
            filteredPoints = this.data.heatmapPoints.filter(p => p.years.includes(this.currentYear));
        }

        heatmapGrid.innerHTML = filteredPoints.map(p => `
            <div class="heatmap-cell heat-level-${p.level}" onclick="HeatmapRenderer.showPointDetail('${p.name}')">
                ${p.name}
                ${p.isHot ? '<span class="heat-badge">⭐</span>' : ''}
            </div>
        `).join('');
    },

    // 渲染柱状图
    renderBarChart() {
        const barChart = document.querySelector('.bar-chart');
        if (!barChart || !this.data.distributionChart) return;

        barChart.innerHTML = this.data.distributionChart.map(dc => `
            <div class="bar-item">
                <div class="bar ${dc.category === '系统架构' ? 'red' : dc.category === '分布式系统' ? 'orange' : dc.category === '数据库架构' ? 'blue' : dc.category === '计算机网络' ? 'green' : 'purple'}" style="height: ${dc.count * 7}px;">
                    <div class="bar-value" style="color:${dc.color};">${dc.count}题</div>
                </div>
                <div class="bar-label">${dc.category.replace('架构', '').replace('系统', '').substring(0, 4)}</div>
            </div>
        `).join('');
    },

    // 渲染排行表格
    renderRankingTable() {
        const rankingTable = document.querySelector('.ranking-table tbody');
        if (!rankingTable || !this.data.ranking) return;

        rankingTable.innerHTML = this.data.ranking.map(r => `
            <tr>
                <td><span class="rank-badge ${r.rank <= 3 ? 'rank-' + r.rank : 'rank-other'}">${r.rank}</span></td>
                <td><strong>${r.name}</strong></td>
                <td>${r.count}次</td>
                <td><span class="freq-badge ${r.frequency === '高频' ? 'freq-high' : 'freq-medium'}">${r.frequency}</span></td>
                <td>${r.years}</td>
                <td>${r.difficulty}</td>
            </tr>
        `).join('');
    },

    // 渲染难度分布
    renderDifficultyStats() {
        const diffSection = document.querySelector('.difficulty-section');
        if (!diffSection || !this.data.difficultyStats) return;

        diffSection.innerHTML = this.data.difficultyStats.map(ds => `
            <div class="diff-card ${ds.level === '简单' ? 'easy' : ds.level === '中等' ? 'medium' : 'hard'}">
                <div class="diff-icon">${ds.level === '简单' ? '🟢' : ds.level === '中等' ? '🟡' : '🔴'}</div>
                <div class="diff-title">${ds.level}题</div>
                <div class="diff-count">${ds.count}题</div>
                <div class="diff-percent">占比 ${ds.percent}%</div>
            </div>
        `).join('');
    },

    // 渲染新增考点
    renderNewTrends() {
        const newPointsGrid = document.querySelector('.new-points-grid');
        if (!newPointsGrid || !this.data.newTrends) return;

        newPointsGrid.innerHTML = this.data.newTrends.map(nt => `
            <div class="new-point-card">
                <div class="new-point-icon">${nt.icon}</div>
                <div class="new-point-title">${nt.name}</div>
                <div class="new-point-desc">${nt.desc}</div>
                <div class="new-point-year">首次出现：${nt.firstYear}年 | 近${nt.count}年考${nt.count}次</div>
            </div>
        `).join('');
    },

    // 渲染趋势图
    renderTrendLines() {
        const trendLines = document.querySelector('.trend-lines');
        if (!trendLines || !this.data.trendLines) return;

        trendLines.innerHTML = this.data.trendLines.map(tl => `
            <div class="trend-line">
                <div class="trend-label" style="color:${tl.color};">${tl.name}</div>
                <div class="trend-bar-container">
                    <div class="trend-bar" style="width:${tl.trend === '持续高频' ? '90%' : tl.trend === '显著上升' ? '85%' : tl.trend === '快速上升' ? '70%' : tl.trend === '新兴热点' ? '45%' : '50%'}; background:linear-gradient(90deg, rgba(${tl.color.slice(1,7)},100), ${tl.color});"></div>
                </div>
                <div class="trend-value" style="color:${tl.color};">${tl.trend === '持续高频' ? '↑ 持续高频' : tl.trend === '显著上升' ? '↑ 显著上升' : tl.trend === '快速上升' ? '↑ 快速上升' : tl.trend === '新兴热点' ? '↑ 新兴热点' : '→ 相对稳定'}</div>
            </div>
        `).join('');
    },

    // 显示考点详情
    showPointDetail(pointName) {
        const point = this.data.heatmapPoints.find(p => p.name === pointName);
        if (!point) return;

        alert(`考点详情：${pointName}\n\n考查频率：${this.data.heatLevels.find(h => h.level === point.level)?.label}\n考查次数：${point.count}次\n考查年份：${point.years}`);
    }
};

// ==================== 备考技巧渲染 ====================
const TipsRenderer = {
    data: null,
    currentCategory: 'all',

    async init() {
        this.data = await loadJSON('data/tips.json');
        if (!this.data) return;
        this.renderCategories();
        this.renderTips();
    },

    // 渲染分类按钮
    renderCategories() {
        const categoriesDiv = document.querySelector('.skill-categories');
        if (!categoriesDiv || !this.data.categories) return;

        const colorMap = {
            'all': 'cat1',
            'strategy': 'cat2',
            'time': 'cat3',
            'answer': 'cat4',
            'memory': 'cat5'
        };

        categoriesDiv.innerHTML = this.data.categories.map(cat => `
            <div class="category-btn ${colorMap[cat.id]} ${cat.id === this.currentCategory ? 'active' : ''}" onclick="TipsRenderer.filterCategory('${cat.id}', this)">
                ${cat.id === 'all' ? '📚' : cat.id === 'strategy' ? '🎯' : cat.id === 'time' ? '⏰' : cat.id === 'answer' ? '📝' : '🧠'} ${cat.name}
            </div>
        `).join('');
    },

    // 渲染技巧卡片
    renderTips() {
        const tipsGrid = document.querySelector('.tips-grid');
        if (!tipsGrid || !this.data.tips) return;

        const colorMap = {
            'strategy': 'blue',
            'time': 'orange',
            'answer': 'green',
            'memory': 'purple'
        };

        tipsGrid.innerHTML = this.data.tips.map(tip => `
            <div class="tip-card ${colorMap[tip.category]}" data-category="${tip.category}" onclick="TipsRenderer.toggleCard(this)">
                <div class="tip-header">
                    <div class="tip-icon">${tip.icon}</div>
                    <div class="tip-title">${tip.title}</div>
                    ${tip.badge ? `<div class="tip-badge ${tip.badge === '热门' ? 'hot' : 'must'}">${tip.badge}</div>` : ''}
                </div>
                <div class="tip-summary">${tip.summary}</div>
                <ul class="tip-points">
                    ${tip.keyPoints.map(kp => `<li class="tip-point">${kp}</li>`).join('')}
                </ul>
                <div class="tip-detail">
                    ${this.renderTipDetail(tip)}
                </div>
                <div class="expand-btn">展开详情 ↓</div>
            </div>
        `).join('');
    },

    // 渲染技巧详情
    renderTipDetail(tip) {
        if (!tip.detail) return '';

        let detailHTML = '<div class="detail-section"><div class="detail-title">📌 详细说明</div><div class="detail-content">';

        if (tip.detail.strategy) {
            detailHTML += `<p><strong>策略说明：</strong>${tip.detail.strategy}</p>`;
        }

        if (tip.detail.template) {
            detailHTML += `<p style="margin-top:8px;"><strong>答题模板：</strong>${tip.detail.template}</p>`;
        }

        if (tip.detail.scoringPoints) {
            detailHTML += `<p style="margin-top:8px;"><strong>得分要点：</strong>${tip.detail.scoringPoints}</p>`;
        }

        if (tip.detail.structure) {
            detailHTML += `<p style="margin-top:8px;"><strong>结构框架：</strong>${tip.detail.structure}</p>`;
        }

        if (tip.detail.timeAllocation) {
            detailHTML += `<p style="margin-top:8px;"><strong>时间分配：</strong>${tip.detail.timeAllocation}</p>`;
        }

        if (tip.detail.writingPoints) {
            detailHTML += `<p style="margin-top:8px;"><strong>写作要点：</strong>${tip.detail.writingPoints}</p>`;
        }

        // 表格数据
        if (tip.detail.scheduleTable) {
            detailHTML += `<table class="time-table" style="margin-top:10px;"><thead><tr><th>科目</th><th>总时间</th><th>建议</th></tr></thead><tbody>`;
            tip.detail.scheduleTable.forEach(row => {
                detailHTML += `<tr><td>${row.subject}</td><td>${row.total}</td><td>${row.firstPass || row.perQuestion || row.draft}</td></tr>`;
            });
            detailHTML += '</tbody></table>';
        }

        if (tip.detail.planTable) {
            detailHTML += `<table class="time-table" style="margin-top:10px;"><thead><tr><th>天数</th><th>主题</th><th>任务</th></tr></thead><tbody>`;
            tip.detail.planTable.forEach(row => {
                detailHTML += `<tr><td>Day ${row.day}</td><td>${row.topic}</td><td>${row.tasks.join(', ')}</td></tr>`;
            });
            detailHTML += '</tbody></table>';
        }

        if (tip.detail.timeFlow) {
            detailHTML += `<div class="flow-diagram" style="margin-top:15px;">`;
            tip.detail.timeFlow.forEach((phase, i) => {
                detailHTML += `<div class="flow-step">${phase.phase}<br>${phase.time}</div>`;
                if (i < tip.detail.timeFlow.length - 1) {
                    detailHTML += '<div class="flow-arrow">→</div>';
                }
            });
            detailHTML += '</div>';
        }

        if (tip.detail.keywords) {
            detailHTML += `<div style="margin-top:10px;"><strong>关键词识别：</strong>`;
            tip.detail.keywords.forEach(kw => {
                detailHTML += `<p style="margin-top:5px;">• "${kw.keyword}" → ${kw.meaning}（${kw.example}）</p>`;
            });
            detailHTML += '</div>';
        }

        if (tip.detail.mnemonics) {
            detailHTML += `<div style="margin-top:10px;"><strong>记忆口诀：</strong>`;
            tip.detail.mnemonics.forEach(mn => {
                detailHTML += `<p style="margin-top:5px;">• ${mn.topic}："${mn.mnemonic}"</p>`;
            });
            detailHTML += '</div>';
        }

        if (tip.detail.quickTable) {
            detailHTML += `<table class="time-table" style="margin-top:10px;"><thead><tr><th>考点</th><th>要点</th><th>备注</th></tr></thead><tbody>`;
            tip.detail.quickTable.forEach(row => {
                detailHTML += `<tr><td>${row.topic}</td><td>${row.key}</td><td>${row.note}</td></tr>`;
            });
            detailHTML += '</tbody></table>';
        }

        if (tip.examples) {
            detailHTML += `<div class="detail-example" style="margin-top:15px;"><div class="detail-example-label">💡 示例应用</div>`;
            tip.examples.forEach(ex => {
                detailHTML += `<p>• ${ex.question} → ${ex.tip}</p>`;
            });
            detailHTML += '</div>';
        }

        if (tip.warnings) {
            detailHTML += `<div style="margin-top:10px; padding:10px; background:rgba(211,47,47,0.1); border-radius:5px;"><strong>⚠️ 注意事项：</strong>`;
            tip.warnings.forEach(w => {
                detailHTML += `<p style="margin-top:5px;">• ${w}</p>`;
            });
            detailHTML += '</div>';
        }

        detailHTML += '</div></div>';
        return detailHTML;
    },

    // 筛选分类
    filterCategory(category, element) {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        element.classList.add('active');
        this.currentCategory = category;

        document.querySelectorAll('.tip-card').forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    },

    // 展开/收起卡片
    toggleCard(card) {
        card.classList.toggle('expanded');
        const btn = card.querySelector('.expand-btn');
        if (card.classList.contains('expanded')) {
            btn.textContent = '收起详情 ↑';
        } else {
            btn.textContent = '展开详情 ↓';
        }
    }
};

// 初始化所有模块
document.addEventListener('DOMContentLoaded', async () => {
    // 根据页面路径初始化对应模块
    const path = window.location.pathname;

    if (path.includes('knowledge.html')) {
        await KnowledgeRenderer.init();
    } else if (path.includes('questions.html')) {
        await QuestionsRenderer.init();
    } else if (path.includes('exam.html')) {
        await ExamRenderer.init();
    } else if (path.includes('essay.html')) {
        await EssayRenderer.init();
    } else if (path.includes('heatmap.html')) {
        await HeatmapRenderer.init();
    } else if (path.includes('tips.html')) {
        await TipsRenderer.init();
    }
});

// 全局辅助函数
function selectOption(element, label, result) {
    element.parentElement.querySelectorAll('.option-item').forEach(opt => {
        opt.classList.remove('selected', 'correct', 'wrong');
    });
    element.classList.add('selected', result);
}

function toggleAnswer(btn) {
    const answerSection = btn.nextElementSibling;
    if (answerSection.classList.contains('expanded')) {
        answerSection.classList.remove('expanded');
        btn.textContent = '📖 查看答案与解析';
    } else {
        answerSection.classList.add('expanded');
        btn.textContent = '📕 收起答案与解析';
    }
}

function toggleStatus(btn) {
    btn.classList.toggle('active');
}