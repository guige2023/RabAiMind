#!/bin/bash
# RabAi Mind AI PPT 生成平台 - 专业研发团队 Agent 一键启动脚本
# 按产品经理→UI→前端→后端→MCP→运维→QA→代码审查的真实研发流程配置

SESSION_NAME="rabai-ppt-team-pro"
PROJECT_DIR="$(pwd)"
CLAUDE_CMD="claude"

# 颜色输出
red() { echo -e "\033[31m$1\033[0m"; }
green() { echo -e "\033[32m$1\033[0m"; }
blue() { echo -e "\033[34m$1\033[0m"; }

# 环境校验
blue "===== 1/4 环境校验 ====="
if ! command -v tmux &> /dev/null; then
    red "❌ tmux未安装！安装命令：brew install tmux 或 sudo apt install tmux"
    exit 1
fi
if ! command -v $CLAUDE_CMD &> /dev/null; then
    red "❌ Claude Code未安装！安装命令：npm install -g @anthropic-ai/claude-code"
    exit 1
fi
green "✅ 环境校验通过"

# 启动tmux
blue "===== 2/4 启动tmux会话 ====="
tmux kill-session -t $SESSION_NAME 2>/dev/null
tmux new-session -d -s $SESSION_NAME -c $PROJECT_DIR
green "✅ tmux会话[$SESSION_NAME]已启动"

# 启动Claude
blue "===== 3/4 启动Claude Code ====="
tmux send-keys -t $SESSION_NAME "$CLAUDE_CMD" C-m
sleep 3
green "✅ Claude Code已启动"

# 注入专业团队创建指令
blue "===== 4/4 注入专业研发团队指令 ====="
TEAM_CMD=$(cat << 'EOF'
请创建 RabAi Mind AI PPT 生成平台的**专业研发团队**，严格按互联网产品研发流程分工，每个角色需贴合真实工作场景，输出符合行业规范的交付物，代码必须加中文注释、遵循模块化设计：

1. 产品经理 Agent：
   - 核心：拆解“AI PPT生成平台”需求为PRD，定义核心流程（用户输入→Agent解析→火山云生成→SVG渲染→PPTX输出），输出功能清单、验收标准、测试用例验收规则；
   - 交付物：《RabAi Mind PRD》、需求拆解清单、各端交互规范。

2. 技术架构师 Agent：
   - 核心：确认Python 3.10+FastAPI+Docker+Redis技术栈合理性，输出系统架构图，定义核心接口规范，识别API密钥安全、SVG兼容性等技术风险；
   - 交付物：《RabAi Mind 技术架构文档》、代码规范、缓存策略设计。

3. UI/视觉设计师 Agent：
   - 核心：设计PPT模板视觉规范（科技风#165DFF）、Web/小程序交互界面，定义SVG渲染的视觉标准（16:9比例）；
   - 交付物：PPT模板视觉稿、Web端UI组件代码、SVG渲染样式规范。

4. 前端开发 Agent：
   - 核心：基于UI稿开发Vue3 Web端（需求输入、PPT预览、下载）、小程序前端，对接后端API，处理异常提示；
   - 交付物：可运行的前端代码（含中文注释）、接口调用封装、兼容性适配代码。

5. 后端开发 Agent：
   - 核心：实现MiniMax Agent调度、火山云API封装、SVG渲染、okppt转换的核心逻辑，开发FastAPI接口，对接Redis/OSS；
   - 交付物：完善的volc_okppt_tools.py、rabai_mind_agent.py、API接口代码，包含异常重试、日志记录。

6. MCP协议开发 Agent：
   - 核心：扩展mcp-server-okppt的MCP协议，适配Claude/Cursor客户端，调试协议调用，输出对接文档；
   - 交付物：mcp_server.py优化版、《RabAi Mind MCP对接手册》。

7. 运维/部署 Agent：
   - 核心：编写Dockerfile/docker-compose.yml，实现一键部署，配置日志/监控，处理OSS/Redis运维；
   - 交付物：Dockerfile、部署脚本、《RabAi Mind 部署运维手册》。

8. QA测试 Agent：
   - 核心：基于PRD验收标准，设计功能/兼容性/异常测试用例，编写接口自动化脚本，输出测试报告；
   - 交付物：测试用例清单、自动化测试脚本、《RabAi Mind 测试报告》、Bug清单。

9. 代码审查 Agent：
   - 核心：检查代码规范、安全（API密钥）、性能，输出审查报告和优化建议；
   - 交付物：《RabAi Mind 代码审查报告》、代码优化建议。

所有角色需按研发流程协作：产品经理→架构师→UI→前端/后端/MCP→代码审查→QA→运维，确保最终交付的代码可运行、可扩展、符合生产标准。
EOF
)

tmux send-keys -t $SESSION_NAME "$TEAM_CMD" C-m
green "✅ 专业研发团队创建指令已注入"

blue "===== 启动完成 ====="
green "🎉 RabAi Mind 专业研发团队已开始创建，按产品经理→UI→研发→QA→运维的真实流程分工！"
yellow "👉 tmux快捷键：Ctrl+b+箭头键切换分屏；Ctrl+b+d退出会话；重新连接：tmux attach -t $SESSION_NAME"
tmux attach -t $SESSION_NAME