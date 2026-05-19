#!/usr/bin/env python3
"""
模拟题库提取脚本 - 从OCR文本中提取选择题并生成JSON格式题库
"""
import os
import re
import json

# 考点映射关键词
TOPIC_KEYWORDS = {
    "arch": ["架构", "体系结构", "架构风格", "质量属性", "构件", "连接件", "设计模式"],
    "software": ["软件", "测试", "需求", "敏捷", "瀑布", "迭代", "增量", "开发", "文档"],
    "os": ["进程", "线程", "内存", "调度", "死锁", "文件", "磁盘", "操作系统", "任务"],
    "db": ["数据库", "关系", "范式", "ER", "SQL", "事务", "完整性", "候选键", "主键"],
    "network": ["网络", "TCP", "UDP", "HTTP", "IP", "路由", "交换", "协议", "端口"],
    "security": ["安全", "加密", "解密", "认证", "授权", "机密", "完整", "攻击", "病毒", "防火墙"],
    "ip": ["知识产权", "著作权", "专利", "商标", "版权", "保护期", "发表权"],
    "project": ["项目", "范围", "进度", "成本", "风险", "质量", "配置", "变更"],
    "system": ["嵌入式", "实时", "分布式", "云计算", "大数据", "中间件", "集成"],
    "math": ["排列", "组合", "概率", "线性", "矩阵", "图论", "逻辑"],
    "english": ["software", "architecture", "system", "design", "component"],
}

def infer_topic(text):
    """根据题目内容推断考点"""
    for topic, keywords in TOPIC_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return topic
    return "arch"

def infer_subtopic(text, topic):
    """推断子考点"""
    subtopics = {
        "arch": {
            "架构风格": ["管道过滤", "分层", "客户端服务器", "浏览器服务器", "事件驱动", "黑板"],
            "质量属性": ["性能", "可用性", "可修改性", "安全性", "可测试性", "易用性"],
            "架构评估": ["ATAM", "SAAM", "权衡点", "敏感点", "风险点"],
            "设计模式": ["工厂", "抽象工厂", "单例", "观察者", "中介者", "策略", "适配器"],
        },
        "software": {
            "测试方法": ["单元测试", "集成测试", "系统测试", "回归测试", "白盒", "黑盒"],
            "开发模型": ["瀑布", "增量", "迭代", "螺旋", "敏捷", "Scrum"],
            "需求工程": ["需求获取", "需求分析", "需求规约", "需求验证"],
        },
        "db": {
            "范式": ["第一范式", "第二范式", "第三范式", "BCNF", "函数依赖"],
            "设计": ["ER图", "关系模式", "完整性约束", "事务"],
        },
        "network": {
            "协议": ["TCP", "UDP", "HTTP", "HTTPS", "FTP", "DNS", "SMTP"],
            "设备": ["路由器", "交换机", "防火墙", "网关"],
        },
        "security": {
            "算法": ["对称加密", "非对称加密", "RSA", "DES", "AES", "SHA", "MD5"],
            "认证": ["数字签名", "证书", "PKI", "CA"],
        },
        "os": {
            "进程": ["进程状态", "调度算法", "同步", "互斥", "死锁"],
            "内存": ["分页", "分段", "虚拟内存", "页面置换"],
        },
        "ip": {
            "著作权": ["著作权法", "保护期", "发表权", "署名权"],
            "专利": ["发明专利", "实用新型", "外观设计"],
        },
        "project": {
            "范围": ["范围定义", "范围确认", "范围控制", "WBS"],
            "进度": ["关键路径", "甘特图", "进度控制"],
            "配置": ["版本控制", "配置项", "基线"],
        },
    }

    if topic in subtopics:
        for sub, keywords in subtopics[topic].items():
            for kw in keywords:
                if kw in text:
                    return sub

    # 返回默认子考点
    return "综合知识点"

def infer_difficulty(text):
    """推断难度"""
    if len(text) > 300:
        return "hard"
    elif len(text) > 150 or "以下说法" in text:
        return "medium"
    return "easy"

def parse_ocr_text(text_file):
    """解析OCR文本文件，提取题目"""
    with open(text_file, 'r', encoding='utf-8') as f:
        text = f.read()

    # 找到答案区域（通常在题目后面，格式为"数字、答案"）
    # 例如: "53、C"
    answer_pattern = r'(\d+)[、\.\s]+([A-D])(?:\s|$)'
    answers = {}

    for match in re.finditer(answer_pattern, text):
        q_num = int(match.group(1))
        ans = match.group(2)
        if q_num not in answers:
            answers[q_num] = ans
        else:
            # 多选题情况
            if ans not in answers[q_num]:
                answers[q_num] += ans

    print(f"提取答案: {len(answers)} 个")

    # 分割题目区域
    lines = text.split('\n')

    # 找到"一、单项选择题"开始的位置
    start_idx = 0
    for i, line in enumerate(lines):
        if "单项选择题" in line or "选择题" in line:
            start_idx = i + 1
            break

    # 找到答案区域开始的位置（题号+答案格式的连续行）
    answer_start = len(lines)
    for i, line in enumerate(lines[start_idx:], start_idx):
        if re.match(r'^\s*\d+[、\.\s]+[A-D]', line) and "解析" in text[text.find(lines[i]):]:
            answer_start = i
            break

    # 提取题目区域文本
    question_text = '\n'.join(lines[start_idx:answer_start])

    # 按题号分割题目
    # 模式: 数字、或数字.
    question_blocks = re.split(r'\n(?=\d+[、\.\s]+[^A-D])', question_text)

    questions = []
    q_id = 1

    for block in question_blocks:
        if not block.strip():
            continue

        # 提取题号
        num_match = re.match(r'(\d+)[、\.\s]+', block)
        if not num_match:
            continue

        orig_num = int(num_match.group(1))

        # 提取题目文本（到第一个选项A之前）
        # 跳过题号，获取题目内容
        content_after_num = block[num_match.end():]

        # 找到第一个选项的位置
        a_match = re.search(r'A[\.、\s]', content_after_num)
        if not a_match:
            continue

        q_text = content_after_num[:a_match.start()].strip()

        # 提取选项 A, B, C, D
        options_text = content_after_num[a_match.start():]

        # 选项模式: A. 内容 B. 内容 C. 内容 D. 内容
        options = []
        option_pattern = r'([A-D])[\.、\s]+([^A-D]+?)(?=([A-D][\.、\s])|$)'

        for opt_match in re.finditer(option_pattern, options_text):
            opt_letter = opt_match.group(1)
            opt_content = opt_match.group(2).strip()
            # 清理选项内容中的换行符
            opt_content = re.sub(r'\s+', ' ', opt_content)
            options.append(f"{opt_letter}. {opt_content}")

        # 如果选项不足4个，尝试其他解析方式
        if len(options) < 4:
            # 简单分割方式
            opt_parts = re.split(r'\s*([A-D])[\.、]\s*', options_text)
            if len(opt_parts) >= 5:
                options = []
                for i in range(1, len(opt_parts), 2):
                    if i+1 < len(opt_parts):
                        letter = opt_parts[i]
                        content = opt_parts[i+1].strip()
                        if letter in ['A', 'B', 'C', 'D']:
                            options.append(f"{letter}. {content}")

        if len(options) < 2:
            continue

        # 获取答案
        answer = answers.get(orig_num, "A")

        # 推断考点
        topic = infer_topic(q_text)
        subtopic = infer_subtopic(q_text, topic)
        difficulty = infer_difficulty(q_text)

        question = {
            "id": f"q_sim_mock_{q_id:03d}",
            "year": "模拟",
            "topic": topic,
            "subTopic": subtopic,
            "difficulty": difficulty,
            "type": "choice",
            "text": q_text,
            "options": options[:4] if len(options) >= 4 else options,
            "answer": answer,
            "isRealQuestion": False,
            "sourceType": "simulation",
            "sourceFile": os.path.basename(text_file).replace('_ocr.txt', '.pdf')
        }

        questions.append(question)
        q_id += 1

    return questions

def main():
    """主函数"""
    # 处理已OCR的文件
    ocr_file = "/tmp/mock1_full.txt"

    print(f"解析文件: {ocr_file}")
    questions = parse_ocr_text(ocr_file)
    print(f"提取题目: {len(questions)} 道")

    # 输出前5题示例
    for q in questions[:5]:
        print(f"\n题目 {q['id']}:")
        print(f"  考点: {q['topic']} - {q['subTopic']}")
        print(f"  内容: {q['text'][:100]}...")
        print(f"  选项: {q['options'][:2]}...")
        print(f"  答案: {q['answer']}")

    # 保存到JSON
    output = {
        "description": "模拟考试题库",
        "questions": questions
    }

    output_file = "/tmp/mock_questions.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n保存到: {output_file}")

if __name__ == "__main__":
    main()