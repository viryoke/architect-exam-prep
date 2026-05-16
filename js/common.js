/* 系统架构设计师冲刺备考网站 - 公共脚本 */

// 进度数据结构
const STORAGE_KEY = 'arch_exam_progress';

// 默认考试日期（2026年5月）
const DEFAULT_EXAM_DATE = '2026-05-21';

// 获取进度数据
function getProgress() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return {
        examDate: DEFAULT_EXAM_DATE,
        tasks: {},
        knowledge: {},
        examResults: [],
        collectedQuestions: [],
        collectedEssays: [],
        markedQuestions: []
    };
}

// 保存进度数据
function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 更新任务状态
function updateTask(day, taskId, completed) {
    const progress = getProgress();
    const key = `day${day}_${taskId}`;
    progress.tasks[key] = completed;
    saveProgress(progress);
}

// 获取任务状态
function getTaskStatus(day, taskId) {
    const progress = getProgress();
    const key = `day${day}_${taskId}`;
    return progress.tasks[key] || false;
}

// 计算某天的完成进度
function calcDayProgress(day) {
    const progress = getProgress();
    const prefix = `day${day}_`;
    const total = Object.keys(progress.tasks).filter(k => k.startsWith(prefix)).length || 4;
    const completed = Object.keys(progress.tasks)
        .filter(k => k.startsWith(prefix))
        .filter(k => progress.tasks[k]).length;
    return { total, completed };
}

// 计算总进度
function calcTotalProgress() {
    const progress = getProgress();
    const allTasks = Object.keys(progress.tasks);
    const total = allTasks.length || 28; // 7天 × 4任务
    const completed = allTasks.filter(k => progress.tasks[k]).length;
    return { total, completed, percent: Math.round((completed / total) * 100) };
}

// 更新知识点学习状态
function updateKnowledge(nodeName, learned) {
    const progress = getProgress();
    progress.knowledge[nodeName] = learned;
    saveProgress(progress);
}

// 获取知识点学习状态
function getKnowledgeStatus(nodeName) {
    const progress = getProgress();
    return progress.knowledge[nodeName] || false;
}

// 保存模拟考试成绩
function saveExamResult(score, correctCount, wrongCount, timeUsed) {
    const progress = getProgress();
    progress.examResults.push({
        date: new Date().toISOString(),
        score,
        correctCount,
        wrongCount,
        timeUsed
    });
    saveProgress(progress);
}

// 获取考试成绩历史
function getExamResults() {
    const progress = getProgress();
    return progress.examResults;
}

// 收藏题目
function collectQuestion(questionId) {
    const progress = getProgress();
    if (!progress.collectedQuestions.includes(questionId)) {
        progress.collectedQuestions.push(questionId);
        saveProgress(progress);
    }
}

// 取消收藏题目
function uncollectQuestion(questionId) {
    const progress = getProgress();
    const idx = progress.collectedQuestions.indexOf(questionId);
    if (idx !== -1) {
        progress.collectedQuestions.splice(idx, 1);
        saveProgress(progress);
    }
}

// 检查题目是否已收藏
function isQuestionCollected(questionId) {
    const progress = getProgress();
    return progress.collectedQuestions.includes(questionId);
}

// 标记题目
function markQuestion(questionId) {
    const progress = getProgress();
    if (!progress.markedQuestions.includes(questionId)) {
        progress.markedQuestions.push(questionId);
        saveProgress(progress);
    }
}

// 取消标记题目
function unmarkQuestion(questionId) {
    const progress = getProgress();
    const idx = progress.markedQuestions.indexOf(questionId);
    if (idx !== -1) {
        progress.markedQuestions.splice(idx, 1);
        saveProgress(progress);
    }
}

// 检查题目是否已标记
function isQuestionMarked(questionId) {
    const progress = getProgress();
    return progress.markedQuestions.includes(questionId);
}

// 计算距离考试的剩余天数
function calcDaysRemaining() {
    const progress = getProgress();
    const examDate = new Date(progress.examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// 设置考试日期
function setExamDate(dateStr) {
    const progress = getProgress();
    progress.examDate = dateStr;
    saveProgress(progress);
}

// 获取考试日期
function getExamDate() {
    const progress = getProgress();
    return progress.examDate;
}

// 格式化时间（秒转为 HH:MM:SS）
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 初始化页面（根据URL参数加载进度）
function initPage() {
    // 加载并显示进度
    const total = calcTotalProgress();
    updateProgressDisplay(total);
}

// 更新进度显示
function updateProgressDisplay(progress) {
    const progressText = document.querySelector('.progress-text');
    const progressFill = document.querySelector('.progress-fill');

    if (progressText) {
        progressText.textContent = `${progress.completed}/${progress.total} 已完成`;
    }

    if (progressFill) {
        progressFill.style.width = `${progress.percent}%`;
    }
}

// ===== 快速导航栏 =====
const NAV_ITEMS = [
    { id: 'home', icon: '🏠', label: '首页', url: 'index.html' },
    { id: 'knowledge', icon: '📚', label: '必学必记', url: 'knowledge.html' },
    { id: 'tips', icon: '💡', label: '备考技巧', url: 'tips.html' },
    { id: 'questions', icon: '📊', label: '真题分析', url: 'questions.html' },
    { id: 'exam', icon: '✍️', label: '考试模拟', url: 'exam.html' },
    { id: 'essay', icon: '📄', label: '论文专区', url: 'essay.html' },
    { id: 'heatmap', icon: '🔥', label: '考点热力图', url: 'heatmap.html' }
];

// 渲染快速导航栏
function renderQuickNav(currentPage) {
    const navBar = document.querySelector('.quick-nav-bar');
    if (!navBar) return;

    navBar.innerHTML = NAV_ITEMS.map(item => {
        const isActive = item.id === currentPage;
        return `
            <div class="quick-nav-item ${item.id} ${isActive ? 'active' : ''}"
                 onclick="location.href='${item.url}'">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
            </div>
        `;
    }).join('');
}