document.addEventListener('DOMContentLoaded', () => {
    const BOARD_SIZE = 15;
    const EMPTY = 0;
    const PLAYER = 1;
    const AI = 2;
    
    const statusElement = document.getElementById('status');
    const boardElement = document.getElementById('board');
    const restartButton = document.getElementById('restart');
    const undoButton = document.getElementById('undo');
    
    let gameBoard = [];
    let gameOver = false;
    let moveHistory = []; // 记录落子历史
    let waitingForAI = false; // 是否正在等待AI落子
    
    // 初始化游戏
    function initGame() {
        gameBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
        gameOver = false;
        waitingForAI = false;
        moveHistory = [];
        boardElement.innerHTML = '';
        
        // 创建棋盘格子
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', handleCellClick);
                boardElement.appendChild(cell);
            }
        }
        
        statusElement.textContent = '轮到你下棋（黑子）';
        updateUndoButton();
    }
    
    // 更新悔棋按钮状态
    function updateUndoButton() {
        // 只有在游戏没有结束、不在等待AI落子，且至少有两步棋（玩家和AI各一步）时才能悔棋
        undoButton.disabled = gameOver || waitingForAI || moveHistory.length < 2;
    }
    
    // 处理玩家点击
    function handleCellClick(event) {
        if (gameOver || waitingForAI) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        // 检查位置是否为空
        if (gameBoard[row][col] !== EMPTY) return;
        
        // 玩家落子
        makeMove(row, col, PLAYER);
        
        // 记录落子
        moveHistory.push({row, col, player: PLAYER});
        
        // 清除上一步标记
        clearLastMoveHighlight();
        
        // 标记当前落子
        highlightLastMove(row, col);
        
        // 检查玩家是否获胜
        if (checkWin(row, col, PLAYER)) {
            gameOver = true;
            statusElement.textContent = '恭喜！你赢了！';
            updateUndoButton();
            return;
        }
        
        // 检查是否平局
        if (isBoardFull()) {
            gameOver = true;
            statusElement.textContent = '游戏结束，平局！';
            updateUndoButton();
            return;
        }
        
        // AI落子
        waitingForAI = true;
        updateUndoButton();
        statusElement.textContent = 'AI思考中...';
        
        setTimeout(() => {
            const aiMove = findBestMove();
            makeMove(aiMove.row, aiMove.col, AI);
            
            // 记录落子
            moveHistory.push({row: aiMove.row, col: aiMove.col, player: AI});
            
            // 清除上一步标记
            clearLastMoveHighlight();
            
            // 标记当前落子
            highlightLastMove(aiMove.row, aiMove.col);
            
            // 检查AI是否获胜
            if (checkWin(aiMove.row, aiMove.col, AI)) {
                gameOver = true;
                statusElement.textContent = 'AI赢了！再接再厉！';
                updateUndoButton();
                return;
            }
            
            // 检查是否平局
            if (isBoardFull()) {
                gameOver = true;
                statusElement.textContent = '游戏结束，平局！';
                updateUndoButton();
                return;
            }
            
            waitingForAI = false;
            updateUndoButton();
            statusElement.textContent = '轮到你下棋（黑子）';
        }, 500);
    }
    
    // 处理悔棋
    function handleUndo() {
        if (gameOver || waitingForAI || moveHistory.length < 2) return;
        
        // 移除AI的最后一步棋
        const aiMove = moveHistory.pop();
        removePiece(aiMove.row, aiMove.col);
        gameBoard[aiMove.row][aiMove.col] = EMPTY;
        
        // 移除玩家的最后一步棋
        const playerMove = moveHistory.pop();
        removePiece(playerMove.row, playerMove.col);
        gameBoard[playerMove.row][playerMove.col] = EMPTY;
        
        // 清除上一步标记
        clearLastMoveHighlight();
        
        // 如果还有棋子，标记最后一步
        if (moveHistory.length > 0) {
            const lastMove = moveHistory[moveHistory.length - 1];
            highlightLastMove(lastMove.row, lastMove.col);
        }
        
        // 更新状态
        gameOver = false;
        statusElement.textContent = '悔棋成功，轮到你下棋（黑子）';
        updateUndoButton();
    }
    
    // 移除棋子
    function removePiece(row, col) {
        const cells = document.querySelectorAll('.cell');
        const index = row * BOARD_SIZE + col;
        const cell = cells[index];
        
        // 移除棋子元素
        if (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
    }
    
    // 高亮显示最后一步棋
    function highlightLastMove(row, col) {
        const cells = document.querySelectorAll('.cell');
        const index = row * BOARD_SIZE + col;
        const cell = cells[index];
        
        if (cell.firstChild) {
            cell.firstChild.classList.add('last-move');
        }
    }
    
    // 清除所有高亮显示
    function clearLastMoveHighlight() {
        const lastMoves = document.querySelectorAll('.last-move');
        lastMoves.forEach(elem => {
            elem.classList.remove('last-move');
        });
    }
    
    // 落子
    function makeMove(row, col, player) {
        gameBoard[row][col] = player;
        
        // 显示棋子
        const cells = document.querySelectorAll('.cell');
        const index = row * BOARD_SIZE + col;
        const cell = cells[index];
        
        const piece = document.createElement('div');
        piece.className = `piece ${player === PLAYER ? 'black' : 'white'}`;
        cell.appendChild(piece);
    }
    
    // 检查是否有玩家获胜
    function checkWin(row, col, player) {
        const directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 对角线
            [1, -1]   // 反对角线
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正方向检查
            for (let i = 1; i <= 4; i++) {
                const newRow = row + i * dx;
                const newCol = col + i * dy;
                
                if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE || gameBoard[newRow][newCol] !== player) {
                    break;
                }
                count++;
            }
            
            // 反方向检查
            for (let i = 1; i <= 4; i++) {
                const newRow = row - i * dx;
                const newCol = col - i * dy;
                
                if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE || gameBoard[newRow][newCol] !== player) {
                    break;
                }
                count++;
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    // 检查棋盘是否已满
    function isBoardFull() {
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (gameBoard[i][j] === EMPTY) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // AI找最佳落子位置 - 使用极大极小算法和Alpha-Beta剪枝
    function findBestMove() {
        // 如果是AI第一步，选择棋盘中心位置或附近
        if (isEmptyBoard() || isFirstFewMoves(3)) {
            return getStrategicFirstMove();
        }

        // 检查必胜走法
        const winningMove = findWinningMove(AI);
        if (winningMove) return winningMove;
        
        // 检查阻止对手必胜走法
        const blockingMove = findWinningMove(PLAYER);
        if (blockingMove) return blockingMove;
        
        // 使用威胁空间搜索和评分系统
        return findBestMoveByThreatSpaceSearch();
    }

    // 检查是否为空棋盘
    function isEmptyBoard() {
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (gameBoard[i][j] !== EMPTY) {
                    return false;
                }
            }
        }
        return true;
    }

    // 检查是否为前几步
    function isFirstFewMoves(moveCount) {
        let count = 0;
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (gameBoard[i][j] !== EMPTY) {
                    count++;
                }
            }
        }
        return count <= moveCount;
    }

    // 获取战略性的第一步走法
    function getStrategicFirstMove() {
        const center = Math.floor(BOARD_SIZE / 2);
        
        // 优先选择中心点
        if (gameBoard[center][center] === EMPTY) {
            return { row: center, col: center };
        }
        
        // 中心点被占，选择周围的点
        const offsets = [-1, 0, 1];
        const possibleMoves = [];
        
        for (const dx of offsets) {
            for (const dy of offsets) {
                if (dx === 0 && dy === 0) continue;
                
                const newRow = center + dx;
                const newCol = center + dy;
                
                if (newRow >= 0 && newRow < BOARD_SIZE && 
                    newCol >= 0 && newCol < BOARD_SIZE && 
                    gameBoard[newRow][newCol] === EMPTY) {
                    possibleMoves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        if (possibleMoves.length > 0) {
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
        
        // 如果周围都被占了，就使用评分系统找最佳位置
        return findBestMoveByThreatSpaceSearch();
    }

    // 寻找制胜走法
    function findWinningMove(player) {
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (gameBoard[i][j] === EMPTY) {
                    // 模拟落子
                    gameBoard[i][j] = player;
                    
                    // 检查是否获胜
                    const isWinning = checkWin(i, j, player);
                    
                    // 撤销落子
                    gameBoard[i][j] = EMPTY;
                    
                    if (isWinning) {
                        return { row: i, col: j };
                    }
                }
            }
        }
        
        return null;
    }

    // 通过威胁空间搜索找最佳位置
    function findBestMoveByThreatSpaceSearch() {
        // 评分表
        const scoreMap = evaluateBoard();
        let bestScore = -1;
        let bestMoves = [];
        
        // 找出评分最高的所有位置
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (gameBoard[i][j] === EMPTY) {
                    const score = scoreMap[i][j];
                    if (score > bestScore) {
                        bestScore = score;
                        bestMoves = [{ row: i, col: j }];
                    } else if (score === bestScore) {
                        bestMoves.push({ row: i, col: j });
                    }
                }
            }
        }

        // 如果有多个最佳位置，进行进一步筛选
        if (bestMoves.length > 1) {
            return selectBestMoveFromCandidates(bestMoves);
        }
        
        // 从最佳位置中选择一个
        return bestMoves[0];
    }

    // 从候选位置中选择最佳位置
    function selectBestMoveFromCandidates(candidates) {
        // 对每个候选位置进行更深层次的评估
        let bestScore = -Infinity;
        let bestMove = candidates[0];
        
        for (const move of candidates) {
            // 模拟AI落子
            gameBoard[move.row][move.col] = AI;
            
            // 计算这步棋后的局面分数（使用负极大值算法）
            const score = -negamax(2, -Infinity, Infinity, PLAYER);
            
            // 撤销落子
            gameBoard[move.row][move.col] = EMPTY;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    // 负极大值算法（带Alpha-Beta剪枝）
    function negamax(depth, alpha, beta, player) {
        // 如果达到搜索深度或游戏结束，进行局面评估
        if (depth === 0 || isGameOver()) {
            return evaluatePosition(player);
        }
        
        let maxScore = -Infinity;
        const opponent = player === PLAYER ? AI : PLAYER;
        
        // 只考虑有威胁的位置，减少搜索空间
        const moves = getThreatMoves();
        
        for (const move of moves) {
            gameBoard[move.row][move.col] = player;
            const score = -negamax(depth - 1, -beta, -alpha, opponent);
            gameBoard[move.row][move.col] = EMPTY;
            
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            
            if (alpha >= beta) {
                break; // 剪枝
            }
        }
        
        return maxScore;
    }

    // 获取有威胁性的位置（减少搜索空间）
    function getThreatMoves() {
        const moves = [];
        const consideredCells = new Set();
        
        // 考虑已有棋子周围的空位
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (gameBoard[i][j] !== EMPTY) {
                    // 检查周围3x3区域内的空位
                    for (let dx = -2; dx <= 2; dx++) {
                        for (let dy = -2; dy <= 2; dy++) {
                            if (dx === 0 && dy === 0) continue;
                            
                            const newRow = i + dx;
                            const newCol = j + dy;
                            
                            // 检查位置是否有效且为空
                            if (newRow >= 0 && newRow < BOARD_SIZE && 
                                newCol >= 0 && newCol < BOARD_SIZE && 
                                gameBoard[newRow][newCol] === EMPTY) {
                                
                                const key = `${newRow},${newCol}`;
                                if (!consideredCells.has(key)) {
                                    consideredCells.add(key);
                                    moves.push({ row: newRow, col: newCol });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // 如果没有找到有威胁的位置，返回所有空位
        if (moves.length === 0) {
            for (let i = 0; i < BOARD_SIZE; i++) {
                for (let j = 0; j < BOARD_SIZE; j++) {
                    if (gameBoard[i][j] === EMPTY) {
                        moves.push({ row: i, col: j });
                    }
                }
            }
        }
        
        return moves;
    }

    // 检查游戏是否结束
    function isGameOver() {
        // 检查是否有人获胜
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (gameBoard[i][j] !== EMPTY) {
                    if (checkWin(i, j, gameBoard[i][j])) {
                        return true;
                    }
                }
            }
        }
        
        // 检查是否平局
        return isBoardFull();
    }

    // 评估局面分数
    function evaluatePosition(player) {
        let aiScore = 0;
        let playerScore = 0;
        
        // 水平方向评估
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j <= BOARD_SIZE - 5; j++) {
                aiScore += evaluateLineScore(i, j, 0, 1, AI);
                playerScore += evaluateLineScore(i, j, 0, 1, PLAYER);
            }
        }
        
        // 垂直方向评估
        for (let i = 0; i <= BOARD_SIZE - 5; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                aiScore += evaluateLineScore(i, j, 1, 0, AI);
                playerScore += evaluateLineScore(i, j, 1, 0, PLAYER);
            }
        }
        
        // 对角线方向评估（左上到右下）
        for (let i = 0; i <= BOARD_SIZE - 5; i++) {
            for (let j = 0; j <= BOARD_SIZE - 5; j++) {
                aiScore += evaluateLineScore(i, j, 1, 1, AI);
                playerScore += evaluateLineScore(i, j, 1, 1, PLAYER);
            }
        }
        
        // 对角线方向评估（右上到左下）
        for (let i = 0; i <= BOARD_SIZE - 5; i++) {
            for (let j = 4; j < BOARD_SIZE; j++) {
                aiScore += evaluateLineScore(i, j, 1, -1, AI);
                playerScore += evaluateLineScore(i, j, 1, -1, PLAYER);
            }
        }
        
        return player === AI ? aiScore - playerScore : playerScore - aiScore;
    }

    // 评估一条线的得分
    function evaluateLineScore(row, col, dRow, dCol, player) {
        const opponent = player === AI ? PLAYER : AI;
        let score = 0;
        let consecutive = 0;
        let openEnds = 0;
        let blocked = false;
        
        // 检查这个方向上连续5个位置
        for (let i = 0; i < 5; i++) {
            const currentRow = row + i * dRow;
            const currentCol = col + i * dCol;
            
            if (gameBoard[currentRow][currentCol] === player) {
                consecutive++;
            } else if (gameBoard[currentRow][currentCol] === EMPTY) {
                if (consecutive > 0) {
                    openEnds++;
                    score += evaluateConsecutive(consecutive, openEnds, blocked);
                    consecutive = 0;
                    blocked = false;
                }
                openEnds = 1;
            } else {
                if (consecutive > 0) {
                    blocked = true;
                    score += evaluateConsecutive(consecutive, openEnds, blocked);
                    consecutive = 0;
                }
                openEnds = 0;
                blocked = true;
            }
        }
        
        // 处理最后的连续棋子
        if (consecutive > 0) {
            score += evaluateConsecutive(consecutive, openEnds, blocked);
        }
        
        return score;
    }

    // 评估连续棋子的得分
    function evaluateConsecutive(count, openEnds, blocked) {
        if (openEnds === 0 && count < 5) {
            return 0; // 两端都被封死且不足五个，没有价值
        }
        
        switch (count) {
            case 5: return 100000; // 五连珠
            case 4: 
                if (openEnds === 2) return 10000; // 活四
                return 1000; // 冲四
            case 3:
                if (openEnds === 2) return 1000; // 活三
                return 100; // 眠三
            case 2:
                if (openEnds === 2) return 100; // 活二
                return 10; // 眠二
            case 1:
                return 1; // 单子
            default:
                return 0;
        }
    }
    
    // 评估棋盘上每个位置的得分
    function evaluateBoard() {
        const scoreMap = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
        
        // 对每个空位进行评分
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (gameBoard[i][j] === EMPTY) {
                    // 计算AI落子的得分
                    const aiScore = getPositionScore(i, j, AI);
                    // 计算玩家落子的得分 (防守)
                    const playerScore = getPositionScore(i, j, PLAYER);
                    
                    // 根据局面形势调整进攻/防守权重
                    const aggressionFactor = calculateAggressionFactor();
                    
                    // 综合考虑进攻和防守
                    scoreMap[i][j] = Math.max(
                        aiScore * aggressionFactor,
                        playerScore * (1 - aggressionFactor)
                    );
                    
                    // 根据位置给予额外奖励（棋盘中心位置更有价值）
                    scoreMap[i][j] += getPositionBonus(i, j);
                }
            }
        }
        
        return scoreMap;
    }

    // 计算进攻因子（基于当前局势）
    function calculateAggressionFactor() {
        // 计算玩家和AI各自的威胁度
        let playerThreat = 0;
        let aiThreat = 0;
        
        // 玩家有没有三连或更强棋型
        let playerHasThreats = false;
        
        // 扫描棋盘评估威胁
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (gameBoard[i][j] === PLAYER) {
                    const threat = evaluateThreat(i, j, PLAYER);
                    playerThreat += threat;
                    if (threat >= 5) { // 玩家有三连或更强
                        playerHasThreats = true;
                    }
                } else if (gameBoard[i][j] === AI) {
                    aiThreat += evaluateThreat(i, j, AI);
                }
            }
        }
        
        // 基于威胁度计算进攻因子
        if (playerHasThreats || playerThreat > aiThreat * 1.5) {
            return 0.3; // 玩家威胁很大，以防守为主
        } else if (aiThreat > playerThreat) {
            return 0.8; // AI有优势，积极进攻
        } else {
            return 0.6; // 没有明显威胁，偏向进攻
        }
    }

    // 评估位置的威胁度
    function evaluateThreat(row, col, player) {
        const directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 对角线
            [1, -1]   // 反对角线
        ];
        
        let threat = 0;
        
        for (const [dx, dy] of directions) {
            let count = 1;
            let space = 0;
            
            // 正方向检查
            for (let i = 1; i <= 4; i++) {
                const newRow = row + i * dx;
                const newCol = col + i * dy;
                
                if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
                    break;
                }
                
                if (gameBoard[newRow][newCol] === player) {
                    if (space <= 1) count++; // 允许间隔1个空位的连接
                } else if (gameBoard[newRow][newCol] === EMPTY) {
                    space++;
                    if (space > 1) break;
                } else {
                    break;
                }
            }
            
            space = 0;
            
            // 反方向检查
            for (let i = 1; i <= 4; i++) {
                const newRow = row - i * dx;
                const newCol = col - i * dy;
                
                if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
                    break;
                }
                
                if (gameBoard[newRow][newCol] === player) {
                    if (space <= 1) count++; // 允许间隔1个空位的连接
                } else if (gameBoard[newRow][newCol] === EMPTY) {
                    space++;
                    if (space > 1) break;
                } else {
                    break;
                }
            }
            
            // 根据连接数计算威胁度
            if (count >= 5) threat += 100;
            else if (count === 4) threat += 20;
            else if (count === 3) threat += 5;
            else if (count === 2) threat += 1;
        }
        
        return threat;
    }

    // 获取位置分数
    function getPositionScore(row, col, player) {
        // 测试该位置下棋后的分数
        gameBoard[row][col] = player;
        
        // 分析八个方向的棋型并计算总分
        const score = analyzeAllDirections(row, col, player);
        
        // 恢复空位
        gameBoard[row][col] = EMPTY;
        
        return score;
    }

    // 分析所有方向的棋型
    function analyzeAllDirections(row, col, player) {
        const directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 正对角线
            [1, -1]   // 反对角线
        ];
        
        let totalScore = 0;
        
        for (const [dx, dy] of directions) {
            // 获取当前方向的棋型
            const pattern = getPattern(row, col, dx, dy, player);
            // 根据棋型计算得分
            totalScore += getPatternScore(pattern);
        }
        
        return totalScore;
    }

    // 根据位置获取额外奖励分数
    function getPositionBonus(row, col) {
        const center = Math.floor(BOARD_SIZE / 2);
        const distanceFromCenter = Math.max(Math.abs(row - center), Math.abs(col - center));
        
        // 靠近中心的位置有更高的价值
        return Math.max(0, 10 - distanceFromCenter);
    }
    
    // 获取某个位置在某个方向的棋型
    function getPattern(row, col, dx, dy, player) {
        let pattern = '';
        
        // 检查9个位置 (最多可形成五连)
        for (let i = -4; i <= 4; i++) {
            const newRow = row + i * dx;
            const newCol = col + i * dy;
            
            if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
                pattern += 'X'; // 边界外
            } else if (i === 0) {
                pattern += '1'; // 当前位置（假设为己方棋子）
            } else if (gameBoard[newRow][newCol] === player) {
                pattern += '1'; // 己方棋子
            } else if (gameBoard[newRow][newCol] === EMPTY) {
                pattern += '0'; // 空位
            } else {
                pattern += 'X'; // 对方棋子
            }
        }
        
        return pattern;
    }
    
    // 根据棋型计算得分
    function getPatternScore(pattern) {
        // 五连（必胜）
        if (pattern.includes('11111')) return 100000;
        
        // 活四（必胜）
        if (pattern.includes('011110')) return 50000;
        
        // 双冲四（必胜）
        if ((pattern.match(/1111/g) || []).length >= 2) return 20000;
        
        // 冲四活三（必胜）
        if (pattern.match(/1111/) && pattern.match(/011100|001110|010110|011010/)) return 15000;
        
        // 双活三（准必胜）
        if ((pattern.match(/011100|001110|010110|011010/g) || []).length >= 2) return 10000;
        
        // 冲四
        if (pattern.match(/01111|11110|10111|11101|11011/)) return 5000;
        
        // 活三
        if (pattern.match(/011100|001110|010110|011010/)) return 1000;
        
        // 眠三
        if (pattern.match(/11100|00111|10110|01101|10011|11001/)) return 500;
        
        // 活二
        if (pattern.match(/001100|010100|001010/)) return 100;
        
        // 眠二
        if (pattern.match(/11000|00011|10100|00101|10010|01001/)) return 50;
        
        // 活一
        if (pattern.match(/000100|001000/)) return 10;
        
        // 眠一
        if (pattern.match(/10000|00001/)) return 5;
        
        return 1; // 默认最低得分
    }
    
    // 重新开始游戏按钮
    restartButton.addEventListener('click', initGame);
    
    // 悔棋按钮
    undoButton.addEventListener('click', handleUndo);
    
    // 初始化游戏
    initGame();
});
