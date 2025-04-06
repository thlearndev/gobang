document.addEventListener('DOMContentLoaded', () => {
    const BOARD_SIZE = 15;
    const EMPTY = 0;
    const BLACK = 1;
    const WHITE = 2;
    
    // 默认玩家是黑子，AI是白子
    let PLAYER = BLACK;
    let AI = WHITE;
    
    const statusElement = document.getElementById('status');
    const boardElement = document.getElementById('board');
    const restartButton = document.getElementById('restart');
    const undoButton = document.getElementById('undo');
    const playerColorSelect = document.getElementById('player-color');
    
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
        
        // 设置玩家和AI的棋子颜色
        setPlayerColor(playerColorSelect.value);
        
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
        
        updateStatusText();
        updateUndoButton();
        
        // 如果玩家选择白子（后手），则AI先行
        if (PLAYER === WHITE) {
            makeAIMove();
        }
    }
    
    // 设置玩家棋子颜色
    function setPlayerColor(color) {
        if (color === 'black') {
            PLAYER = BLACK;
            AI = WHITE;
        } else {
            PLAYER = WHITE;
            AI = BLACK;
        }
    }
    
    // 更新状态文本
    function updateStatusText() {
        const playerColorText = PLAYER === BLACK ? '黑子' : '白子';
        if (gameOver) {
            // 已有游戏结束文本，不更新
            return;
        } else if (waitingForAI) {
            statusElement.textContent = 'AI思考中...';
        } else {
            statusElement.textContent = `轮到你下棋（${playerColorText}）`;
        }
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
        makeAIMove();
    }
    
    // AI落子
    function makeAIMove() {
        waitingForAI = true;
        updateUndoButton();
        updateStatusText();
        
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
            updateStatusText();
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
        updateStatusText();
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
        piece.className = `piece ${player === BLACK ? 'black' : 'white'}`;
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
        
        // 使用极小极大算法进行搜索
        let bestScore = -Infinity;
        let bestMove = null;
        const depthLimit = 2;  // 递归深度,可调整
        const moves = generateMoves();
        
        for (const move of moves) {
            gameBoard[move.row][move.col] = AI;
            const score = minimax(false, depthLimit-1, -Infinity, Infinity);
            gameBoard[move.row][move.col] = EMPTY;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
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
        
        // 如果周围都被占了，使用正常搜索
        return null;
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

    // minimax算法（带Alpha-Beta剪枝）
    function minimax(isAI, depth, alpha, beta) {
        if (depth === 0) return evaluateAll();
        
        const moves = generateMoves();
        if (moves.length === 0) return 0;
    
        if (isAI) {    // MAX层
            let maxEval = -Infinity;
            for (const move of moves) {
                gameBoard[move.row][move.col] = AI;
                const eval = minimax(false, depth - 1, alpha, beta);
                gameBoard[move.row][move.col] = EMPTY;
                
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) break; // 剪枝
            }
            return maxEval;
        } else {       // MIN层
            let minEval = Infinity;
            for (const move of moves) {
                gameBoard[move.row][move.col] = PLAYER;
                const eval = minimax(true, depth - 1, alpha, beta);
                gameBoard[move.row][move.col] = EMPTY;
                
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break; // 剪枝
            }
            return minEval;
        }
    }
    
    // 只考虑周围2格内有子的空位，提高效率
    function generateMoves() {
        const moves = [];
        const consideredCells = new Set();
        
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (gameBoard[y][x] !== EMPTY) continue;
                
                // 检查周围2格内是否有棋子
                let hasNearbyPiece = false;
                outerLoop: for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const ny = y + dy;
                        const nx = x + dx;
                        
                        if (ny < 0 || nx < 0 || ny >= BOARD_SIZE || nx >= BOARD_SIZE) continue;
                        
                        if (gameBoard[ny][nx] !== EMPTY) {
                            hasNearbyPiece = true;
                            break outerLoop;
                        }
                    }
                }
                
                if (hasNearbyPiece) {
                    const key = `${y},${x}`;
                    if (!consideredCells.has(key)) {
                        consideredCells.add(key);
                        moves.push({ row: y, col: x });
                    }
                }
            }
        }
        
        // 如果没有找到有威胁的位置或棋盘为空，返回中心位置
        if (moves.length === 0) {
            moves.push({ row: Math.floor(BOARD_SIZE / 2), col: Math.floor(BOARD_SIZE / 2) });
        }
        
        return moves;
    }

    // 综合评估函数
    function evaluateAll() {
        return evaluate(AI) - evaluate(PLAYER);
    }

    // 启发式评价函数
    function evaluate(player) {
        let score = 0;
        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (gameBoard[y][x] !== player) continue;
                for (const [dx, dy] of dirs) {
                    let count = 1, block = 0, empty = 0;

                    // 正向
                    for (let i = 1; i < 5; i++) {
                        let nx = x + i * dx, ny = y + i * dy;
                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) { block++; break; }
                        if (gameBoard[ny][nx] === EMPTY) {
                            empty++;
                            break;
                        } else if (gameBoard[ny][nx] === player) {
                            count++;
                        } else { block++; break; }
                    }
                    // 反向
                    for (let i = 1; i < 5; i++) {
                        let nx = x - i * dx, ny = y - i * dy;
                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) { block++; break; }
                        if (gameBoard[ny][nx] === EMPTY) {
                            empty++;
                            break;
                        } else if (gameBoard[ny][nx] === player) {
                            count++;
                        } else { block++; break; }
                    }

                    // 赋值
                    if (count >= 5) score += 100000;
                    else if (count === 4 && block === 0) score += 10000;    // 活四
                    else if (count === 4 && block === 1) score += 1000;     // 冲四
                    else if (count === 3 && block === 0) score += 1000;     // 活三
                    else if (count === 3 && block === 1) score += 100;      // 眠三
                    else if (count === 2 && block === 0) score += 100;      // 活二
                    else if (count === 2 && block === 1) score += 10;       // 眠二
                }
            }
        }
        return score;
    }
    
    // 重新开始游戏按钮
    restartButton.addEventListener('click', initGame);
    
    // 悔棋按钮
    undoButton.addEventListener('click', handleUndo);
    
    // 颜色选择变更监听
    playerColorSelect.addEventListener('change', () => {
        // 重新开始游戏以应用新的颜色选择
        initGame();
    });
    
    // 初始化游戏
    initGame();
});
