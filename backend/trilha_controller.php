<?php
ob_start();

require_once 'check_session.php';

ob_clean();

header('Content-Type: application/json; charset=utf-8');

$host = "localhost";
$user = "gabrielkafferDS";
$password = "gabrielkafferDS123@";
$database = "spectrum";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {

    $sessao = validarSessaoUsuario();

    if (empty($sessao['loggedIn']) || empty($sessao['user']['id'])) {
        echo json_encode(['success' => false, 'error' => 'Sessão inválida']);
        exit;
    }

    $conn = new mysqli($host, $user, $password, $database);
    $conn->set_charset("utf8mb4");

    $action = $_GET['action'] ?? '';
    $user_id = (int) $sessao['user']['id'];
    $nivel = (int) $sessao['user']['nivel'];

    function adicionarInfoCursos($lista, $conn) {
        foreach ($lista as &$item) {

            $stmt = $conn->prepare("
                SELECT 
                    COUNT(*) as total_aulas,
                    COALESCE(SUM(duracao),0) as total_duracao
                FROM cursos
                WHERE id_trilha = ?
                AND status = 1
            ");
            $stmt->bind_param("i", $item['id_trilha']);
            $stmt->execute();
            $res = $stmt->get_result()->fetch_assoc();

            $item['total_aulas'] = $res['total_aulas'];
            $item['total_duracao'] = $res['total_duracao'];
        }
        return $lista;
    }

    function marcarFavoritos($lista, $conn, $user_id) {
        foreach ($lista as &$item) {
            $stmt = $conn->prepare("
                SELECT 1 
                FROM meusinteresses 
                WHERE id_user = ? AND id_trilha = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $item['id_trilha']);
            $stmt->execute();
            $result = $stmt->get_result();
            $item['favorito'] = $result->num_rows > 0 ? 1 : 0;
        }
        return $lista;
    }

    switch ($action) {

        case 'dashboard':

            $sql = "
                SELECT t.*, i.nome as nome_tag, p.status as progresso_status
                FROM trilha t
                JOIN progresso_trilha p ON p.id_trilha = t.id_trilha
                LEFT JOIN tag_interesse i ON t.id_tag_interesse = i.id_interesse
                WHERE p.id_user = ?
                AND p.status = 1
                AND t.status = 1
            ";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $em_andamento = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            $sql = "
                SELECT t.*, i.nome as nome_tag, p.status as progresso_status
                FROM trilha t
                LEFT JOIN tag_interesse i ON t.id_tag_interesse = i.id_interesse
                LEFT JOIN progresso_trilha p 
                    ON p.id_trilha = t.id_trilha AND p.id_user = ?
                WHERE t.id_trilha NOT IN (
                    SELECT id_trilha 
                    FROM progresso_trilha 
                    WHERE id_user = ?
                )
                AND t.status = 1
                LIMIT 5
            ";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $user_id, $user_id);
            $stmt->execute();
            $recomendados = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            $sql = "
                SELECT t.*, i.nome as nome_tag, p.status as progresso_status
                FROM trilha t
                JOIN meusinteresses mi ON mi.id_trilha = t.id_trilha
                LEFT JOIN tag_interesse i ON t.id_tag_interesse = i.id_interesse
                LEFT JOIN progresso_trilha p 
                    ON p.id_trilha = t.id_trilha AND p.id_user = ?
                WHERE mi.id_user = ?
                AND t.status = 1
            ";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $user_id, $user_id);
            $stmt->execute();
            $interesses = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            $em_andamento = marcarFavoritos($em_andamento, $conn, $user_id);
            $recomendados = marcarFavoritos($recomendados, $conn, $user_id);
            $interesses = marcarFavoritos($interesses, $conn, $user_id);

            $em_andamento = adicionarInfoCursos($em_andamento, $conn);
            $recomendados = adicionarInfoCursos($recomendados, $conn);
            $interesses = adicionarInfoCursos($interesses, $conn);

            echo json_encode([
                'success' => true,
                'em_andamento' => $em_andamento,
                'recomendados' => $recomendados,
                'interesses' => $interesses
            ]);
        break;

        case 'toggle_favorito':

            $id_trilha = (int) ($_POST['id_trilha'] ?? 0);

            if ($id_trilha <= 0) {
                echo json_encode(['success' => false, 'error' => 'Trilha inválida']);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT id_trilha 
                FROM meusinteresses 
                WHERE id_user = ? AND id_trilha = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_trilha);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {

                $stmt = $conn->prepare("
                    DELETE FROM meusinteresses 
                    WHERE id_user = ? AND id_trilha = ?
                ");
                $stmt->bind_param("ii", $user_id, $id_trilha);
                $stmt->execute();

                echo json_encode(['success' => true, 'favorito' => 0]);

            } else {

                $stmt = $conn->prepare("
                    INSERT INTO meusinteresses (id_user, id_trilha) 
                    VALUES (?, ?)
                ");
                $stmt->bind_param("ii", $user_id, $id_trilha);
                $stmt->execute();

                echo json_encode(['success' => true, 'favorito' => 1]);
            }

        break;

        case 'list':

            $sql = "
                SELECT t.*, i.nome as nome_tag
                FROM trilha t
                LEFT JOIN tag_interesse i ON t.id_tag_interesse = i.id_interesse
                WHERE t.status = 1
            ";
            $result = $conn->query($sql);

            echo json_encode([
                'success' => true,
                'dados' => $result->fetch_all(MYSQLI_ASSOC)
            ]);
        break;

        case 'list_tags':

            $result = $conn->query("SELECT id_interesse as id, nome FROM tag_interesse ORDER BY nome ASC");
            $tags = [];

            if ($result) {
                $tags = $result->fetch_all(MYSQLI_ASSOC);
            }

            echo json_encode($tags ?: []);
        break;

        default:
            echo json_encode(['success' => false, 'error' => 'Ação inválida']);
        break;
    }

    $conn->close();

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

ob_end_flush();
?>