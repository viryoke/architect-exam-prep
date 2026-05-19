#!/usr/bin/env python3
"""
模拟题库提取脚本 - 从PDF中提取选择题并生成JSON格式题库
"""

import os
import re
import json
import subprocess
from pathlib import Path

# 配置
PDF_DIR = "~/Downloads/软考/2026年系统架构设计师最新版（高级）/08、模拟卷/综合知识模拟题"
TESSERACT_PATH = "/opt/homebrew/bin/tesseract"
PDFTOPPM_PATH = "/opt/homebrew/bin/pdftoppm"
OUTPUT_FILE = "data/simulation_questions.json"

# 考点映射
TOPIC_MAPPING = {
    "架构": "arch",
    "软件": "software",
    "系统": "system",
    "操作": "os",
    "数据库": "db",
    "网络": "network",
    "安全": "security",
    "知识产权": "ip",
    "著作权": "ip",
    "专利": "ip",
    "数学": "math",
    "分布式": "dist",
    "英语": "english",
    "项目管理": "project",
}

def convert_pdf_to_images(pdf_path, output_dir):
    """将PDF转换为PNG图像"""
    os.makedirs(output_dir, exist_ok=True)
    cmd = [PDFTOPPM_PATH, "-png", "-r", "200", pdf_path, os.path.join(output_dir, "page")]
    subprocess.run(cmd, capture_output=True)

    # 返回生成的图像文件列表
    images = sorted([f for f in os.listdir(output_dir) if f.endswith('.png')])
    return images

def ocr_image(image_path):
    """使用Tesseract OCR提取文本"""
    # 需要在图像所在目录运行
    image_dir = os.path.dirname(image_path)
    image_name = os.path.basename(image_path)

    result = subprocess.run(
        [TESSERACT_PATH, image_name, "stdout", "-l", "chi_sim+eng"],
        cwd=image_dir,
        capture_output=True,
        text=True
    )
    return result.stdout

def extract_questions_from_text(text):
    """从OCR文本中提取选择题"""
    questions = []

    # 匹配题目模式: 数字、题目内容
    # 例如: "1、详细的项目范围说明书..."
    question_pattern = r'(\d+)[、\s]+(.+?)(?=A\.|A\s)'

    # 匹配选项模式: A. B. C. D.
    option_pattern = r'([A-D])[\.、\s]+([^A-D]+?)(?=[A-D][\.、\s]|$|\n\d+)'

    # 匹配答案模式: "53、C" 或 "53. C"
    answer_pattern = r'(\d+)[、\.\s]+([A-D])'

    # 先提取答案列表
    answers = {}
    for match in re.finditer(answer_pattern, text):
        q_num = int(match.group(1))
        answer = match.group(2)
        # 处理多选题（如AB, ABC等）
        if q_num not in answers:
            answers[q_num] = answer
        else:
            answers[q_num] += answer

    # 分割题目区域（从"一、单项选择题"到答案区域）
    lines = text.split('\n')
    question_area = []
    answer_area = []

    in_questions = False
    in_answers = False

    for line in lines:
        if "单项选择题" in line or "选择题" in line:
            in_questions = True
            in_answers = False
        elif "答案" in line or line.strip().startswith("1、") and "解析" in text[text.find(line):]:
            # 答案区域通常以题号+答案格式开始
            if re.match(r'^\s*\d+[、\.\s]+[A-D]', line):
                in_answers = True
                in_questions = False

        if in_questions:
            question_area.append(line)
        elif in_answers:
            answer_area.append(line)

    # 解析题目
    full_text = '\n'.join(question_area)

    # 按题号分割
    parts = re.split(r'\n(?=\d+[、\.\s])', full_text)

    for part in parts:
        if not part.strip():
            continue

        # 提取题号
        num_match = re.match(r'(\d+)[、\.\s]', part)
        if not num_match:
            continue

        q_num = int(num_match.group(1))

        # 提取题目文本（到第一个选项之前）
        text_match = re.search(r'(\d+)[、\.\s]+(.+?)(?=A[\.、\s])', part, re.DOTALL)
        if not text_match:
            continue

        q_text = text_match.group(2).strip()

        # 提取选项
        options = []
        for opt_match in re.finditer(r'([A-D])[\.、\s]+([^A-D\n]+)', part):
            opt_letter = opt_match.group(1)
            opt_text = opt_match.group(2).strip()
            options.append(f"{opt_letter}. {opt_text}")

        if len(options) < 4:
            continue

        # 获取答案
        answer = answers.get(q_num, "")

        # 推断考点
        topic = infer_topic(q_text)

        question = {
            "id": f"q_sim_{q_num:03d}",
            "year": "模拟",
            "topic": topic,
            "subTopic": infer_subtopic(q_text, topic),
            "difficulty": infer_difficulty(q_text),
            "type": "choice",
            "text": q_text,
            "options": options,
            "answer": answer,
            "isRealQuestion": False,
            "sourceType": "simulation"
        }

        questions.append(question)

    return questions

def infer_topic(text):
    """根据题目内容推断考点"""
    for keyword, topic in TOPIC_MAPPING.items():
        if keyword in text:
            return topic

    # 默认返回架构
    return "arch"

def infer_subtopic(text, topic):
    """推断子考点"""
    # 根据关键词推断具体子考点
    if topic == "arch":
        if "架构风格" in text or "架构模式" in text:
            return "架构风格选择"
        elif "评估" in text:
            return "架构评估方法"
        elif "质量属性" in text:
            return "质量属性场景"
        return "系统架构设计"

    elif topic == "software":
        if "测试" in text:
            return "软件测试方法"
        elif "敏捷" in text:
            return "敏捷开发"
        elif "需求" in text:
            return "需求分析"
        return "软件工程"

    elif topic == "db":
        if "范式" in text:
            return "范式判定"
        elif "ER" in text or "E-R" in text:
            return "E-R图设计"
        elif "SQL" in text:
            return "SQL查询"
        return "数据库设计"

    elif topic == "network":
        if "TCP" in text or "HTTP" in text:
            return "网络协议"
        elif "IP" in text:
            return "IP地址规划"
        return "计算机网络"

    elif topic == "security":
        if "加密" in text:
            return "加密算法"
        elif "认证" in text:
            return "认证技术"
        return "信息安全"

    elif topic == "os":
        if "进程" in text:
            return "进程管理"
        elif "内存" in text or "存储" in text:
            return "内存管理"
        return "操作系统"

    return "综合知识点"

def infer_difficulty(text):
    """推断难度"""
    # 根据题目长度和关键词判断
    if len(text) > 200 or "以下说法" in text or "正确的是" in text:
        return "medium"
    elif "错误" in text or "不" in text:
        return "hard"
    return "easy"

def process_mock_exam(pdf_path, exam_name):
    """处理单个模拟卷PDF"""
    print(f"处理: {exam_name}")

    # 创建临时目录
    temp_dir = f"/tmp/mock_{exam_name}"
    os.makedirs(temp_dir, exist_ok=True)

    # 转换PDF为图像
    images = convert_pdf_to_images(pdf_path, temp_dir)
    print(f"  生成 {len(images)} 页图像")

    # OCR所有页面
    full_text = ""
    for img in images:
        img_path = os.path.join(temp_dir, img)
        text = ocr_image(img_path)
        full_text += text + "\n"

    # 保存OCR文本
    text_file = f"/tmp/{exam_name}_ocr.txt"
    with open(text_file, 'w') as f:
        f.write(full_text)
    print(f"  OCR文本保存到: {text_file}")

    # 提取题目
    questions = extract_questions_from_text(full_text)
    print(f"  提取 {len(questions)} 道题目")

    return questions, full_text

def main():
    """主函数"""
    pdf_dir = Path(PDF_DIR).expanduser()

    # 获取所有模拟卷PDF
    pdf_files = list(pdf_dir.glob("*.pdf"))
    print(f"找到 {len(pdf_files)} 个PDF文件")

    all_questions = []
    exam_sets = []

    for i, pdf_file in enumerate(pdf_files[:5]):  # 先处理前5套
        exam_name = pdf_file.stem
        questions, _ = process_mock_exam(str(pdf_file), exam_name)

        # 添加套题信息
        exam_set = {
            "id": f"set{i+1}",
            "name": f"第{i+1}套模拟题",
            "sourceFile": exam_name,
            "questionCount": len(questions),
            "questions": questions
        }
        exam_sets.append(exam_set)
        all_questions.extend(questions)

    # 生成最终JSON
    output = {
        "description": "模拟考试题库 - 从辅导资料提取",
        "totalQuestions": len(all_questions),
        "examSets": exam_sets,
        "questions": all_questions
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n完成! 共提取 {len(all_questions)} 道题目")
    print(f"输出文件: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()