<?php
header('Content-Type: application/json; charset=utf-8');

$host     = "localhost";
$user     = "gabrielkafferDS";
$password = "gabrielkafferDS123@";
$database = "spectrum";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['user_id']) || !isset($_SESSION['nivel'])) {
        echo json_encode(['success' => false, 'error' => 'Sessão inválida']);
        exit;
    }

    $conn = new mysqli($host, $user, $password, $database);
    $conn->set_charset("utf8mb4");

    $action  = $_POST['action'] ?? $_GET['action'] ?? '';
    $user_id = (int) $_SESSION['user_id'];
    $nivel   = (int) $_SESSION['nivel'];

    // Apenas nível 0 e 1 têm acesso
    if (!in_array($nivel, [0, 1])) {
        echo json_encode(['success' => false, 'error' => 'Acesso negado']);
        exit;
    }

    switch ($action) {

        /* ── LISTAR TRILHAS (paginado) ─────────────────────────────────── */
        case 'list':
            $pagina = isset($_GET['p']) ? max(1, (int)$_GET['p']) : 1;
            $limit  = 10;
            $offset = ($pagina - 1) * $limit;

            if ($nivel === 0) {
                $sqlCount = "SELECT COUNT(*) AS total FROM trilha";
                $stmtCount = $conn->prepare($sqlCount);
            } else {
                $sqlCount = "SELECT COUNT(*) AS total FROM trilha WHERE id_usuario = ?";
                $stmtCount = $conn->prepare($sqlCount);
                $stmtCount->bind_param("i", $user_id);
            }
            $stmtCount->execute();
            $totalRegistros = $stmtCount->get_result()->fetch_assoc()['total'];

            if ($nivel === 0) {
                $sql  = "SELECT t.*, i.nome AS nome_tag
                         FROM trilha t
                         LEFT JOIN tag_interesse i ON t.id_tag_interesse = i.id_interesse
                         ORDER BY t.id_trilha DESC
                         LIMIT ? OFFSET ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ii", $limit, $offset);
            } else {
                $sql  = "SELECT t.*, i.nome AS nome_tag
                         FROM trilha t
                         LEFT JOIN tag_interesse i ON t.id_tag_interesse = i.id_interesse
                         WHERE t.id_usuario = ?
                         ORDER BY t.id_trilha DESC
                         LIMIT ? OFFSET ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("iii", $user_id, $limit, $offset);
            }

            $stmt->execute();
            $dados = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            echo json_encode([
                'dados'       => $dados,
                'total'       => $totalRegistros,
                'pagina'      => $pagina,
                'totalPaginas'=> (int) ceil($totalRegistros / $limit)
            ]);
        break;

        /* ── LISTAR TAGS ───────────────────────────────────────────────── */
        case 'list_tags':
            $result = $conn->query("SELECT id_interesse AS id, nome FROM tag_interesse ORDER BY nome ASC");
            echo json_encode($result->fetch_all(MYSQLI_ASSOC) ?: []);
        break;

        /* ── SALVAR (INSERT ou UPDATE) ─────────────────────────────────── */
        case 'save':
            $id     = !empty($_POST['id_trilha']) ? (int)$_POST['id_trilha'] : 0;
            $nome   = trim($_POST['nome']        ?? '');
            $desc   = trim($_POST['descricao']   ?? '');
            $img    = trim($_POST['img']         ?? '');
            $tag    = !empty($_POST['id_tag_interesse']) ? (int)$_POST['id_tag_interesse'] : null;
            $status = (int)($_POST['status']     ?? 0);

            if ($nome === '') {
                echo json_encode(['success' => false, 'error' => 'Nome da trilha é obrigatório']);
                exit;
            }

            // Validação: status=1 só permitido se existir curso ativo vinculado
            if ($status === 1) {
                if ($id > 0) {
                    // Edição: verifica cursos da trilha existente
                    $chk = $conn->prepare("SELECT COUNT(*) AS total FROM cursos WHERE id_trilha = ? AND status = 1");
                    $chk->bind_param("i", $id);
                } else {
                    // Inserção: trilha ainda não existe, impossível ter curso
                    $chk = null;
                }

                $temCurso = false;
                if ($chk) {
                    $chk->execute();
                    $temCurso = $chk->get_result()->fetch_assoc()['total'] > 0;
                }

                if (!$temCurso) {
                    echo json_encode([
                        'success' => false,
                        'error'   => 'Não é possível definir status Ativo sem ao menos um curso ativo vinculado a esta trilha.'
                    ]);
                    exit;
                }
            }

            if ($id === 0) {
                // INSERT
                $stmt = $conn->prepare(
                    "INSERT INTO trilha (nome, descricao, img, id_tag_interesse, status, id_usuario, data_criacao)
                     VALUES (?, ?, ?, ?, ?, ?, CURDATE())"
                );
                $stmt->bind_param("sssiii", $nome, $desc, $img, $tag, $status, $user_id);
            } else {
                // UPDATE – nível 1 só altera as próprias trilhas
                if ($nivel === 0) {
                    $stmt = $conn->prepare(
                        "UPDATE trilha SET nome=?, descricao=?, img=?, id_tag_interesse=?, status=?
                         WHERE id_trilha=?"
                    );
                    $stmt->bind_param("sssiii", $nome, $desc, $img, $tag, $status, $id);
                } else {
                    $stmt = $conn->prepare(
                        "UPDATE trilha SET nome=?, descricao=?, img=?, id_tag_interesse=?, status=?
                         WHERE id_trilha=? AND id_usuario=?"
                    );
                    $stmt->bind_param("sssiiii", $nome, $desc, $img, $tag, $status, $id, $user_id);
                }
            }

            $stmt->execute();

            if ($stmt->affected_rows === 0 && $id > 0) {
                echo json_encode(['success' => false, 'error' => 'Registro não encontrado ou sem permissão']);
            } else {
                echo json_encode(['success' => true]);
            }
        break;

        /* ── DELETAR ───────────────────────────────────────────────────── */
        case 'delete':
            $id = (int)($_GET['id'] ?? 0);

            if ($id <= 0) {
                echo json_encode(['success' => false, 'error' => 'ID inválido']);
                exit;
            }

            if ($nivel === 0) {
                $stmt = $conn->prepare("DELETE FROM trilha WHERE id_trilha = ?");
                $stmt->bind_param("i", $id);
            } else {
                $stmt = $conn->prepare("DELETE FROM trilha WHERE id_trilha = ? AND id_usuario = ?");
                $stmt->bind_param("ii", $id, $user_id);
            }

            $stmt->execute();
            echo json_encode(['success' => true]);
        break;

        default:
            echo json_encode(['success' => false, 'error' => 'Ação inválida: ' . $action]);
        break;
    }

    $conn->close();

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
exit;