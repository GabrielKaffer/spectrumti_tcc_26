<?php
header('Content-Type: application/json; charset=utf-8');

$host = "localhost";
$user = "gabrielkafferDS";
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

    // Captura a ação de ambas as formas (POST para salvar, GET para listar/deletar)
    $action = $_POST['action'] ?? $_GET['action'] ?? '';

    $user_id = $_SESSION['user_id'];
    $nivel = $_SESSION['nivel'];

    switch ($action) {

        case 'list':
            $pagina = isset($_GET['p']) ? (int)$_GET['p'] : 1;
            $limit = 10;
            $offset = ($pagina - 1) * $limit;

            if ($nivel == 0) {
                $sqlCount = "SELECT COUNT(*) as total FROM trilha";
                $stmtCount = $conn->prepare($sqlCount);
            } else {
                $sqlCount = "SELECT COUNT(*) as total FROM trilha WHERE id_usuario = ?";
                $stmtCount = $conn->prepare($sqlCount);
                $stmtCount->bind_param("s", $user_id);
            }

            $stmtCount->execute();
            $totalRegistros = $stmtCount->get_result()->fetch_assoc()['total'];

            if ($nivel == 0) {
                $sql = "SELECT t.*, i.nome as nome_tag 
                        FROM trilha t 
                        LEFT JOIN tag_interesse i ON t.id_tag_interesse = i.id_interesse 
                        ORDER BY t.id_trilha DESC LIMIT ? OFFSET ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ii", $limit, $offset);
            } else {
                $sql = "SELECT t.*, i.nome as nome_tag 
                        FROM trilha t 
                        LEFT JOIN tag_interesse i ON t.id_tag_interesse = i.id_interesse 
                        WHERE t.id_usuario = ? 
                        ORDER BY t.id_trilha DESC LIMIT ? OFFSET ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("sii", $user_id, $limit, $offset);
            }

            $stmt->execute();
            $dados = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            echo json_encode([
                'dados' => $dados,
                'total' => $totalRegistros,
                'pagina' => $pagina,
                'totalPaginas' => ceil($totalRegistros / $limit)
            ]);
        break;

        case 'list_tags':
            $result = $conn->query("SELECT id_interesse as id, nome FROM tag_interesse ORDER BY nome ASC");
            $tags = $result->fetch_all(MYSQLI_ASSOC);
            echo json_encode($tags ? $tags : []);
        break;

        case 'save':
            $id = $_POST['id_trilha'] ?? '';
            $nome = $_POST['nome'] ?? '';
            $desc = $_POST['descricao'] ?? '';
            $img = $_POST['img'] ?? '';
            $tag = !empty($_POST['id_tag_interesse']) ? $_POST['id_tag_interesse'] : null;
            $status = $_POST['status'] ?? 0;

            if (empty($id)) {
                $stmt = $conn->prepare("INSERT INTO trilha (nome, descricao, img, id_tag_interesse, status, id_usuario, data_criacao) VALUES (?, ?, ?, ?, ?, ?, NOW())");
                $stmt->bind_param("ssssis", $nome, $desc, $img, $tag, $status, $user_id);
            } else {
                if ($nivel == 0) {
                    $stmt = $conn->prepare("UPDATE trilha SET nome=?, descricao=?, img=?, id_tag_interesse=?, status=? WHERE id_trilha=?");
                    $stmt->bind_param("sssiii", $nome, $desc, $img, $tag, $status, $id);
                } else {
                    $stmt = $conn->prepare("UPDATE trilha SET nome=?, descricao=?, img=?, id_tag_interesse=?, status=? WHERE id_trilha=? AND id_usuario=?");
                    $stmt->bind_param("ssssisi", $nome, $desc, $img, $tag, $status, $id, $user_id);
                }
            }

            $stmt->execute();
            echo json_encode(['success' => true]);
        break;

        case 'delete':
            $id = $_GET['id'] ?? 0;

            if ($nivel == 0) {
                $stmt = $conn->prepare("DELETE FROM trilha WHERE id_trilha = ?");
                $stmt->bind_param("i", $id);
            } else {
                $stmt = $conn->prepare("DELETE FROM trilha WHERE id_trilha = ? AND id_usuario = ?");
                $stmt->bind_param("is", $id, $user_id);
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