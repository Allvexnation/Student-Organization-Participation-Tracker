<?php

function makeController($backendDir) {
    echo "\n--- Make Controller ---\n";
    echo "Controller name (e.g., UserController, ProductController): ";
    $name = trim(fgets(STDIN));

    if (empty($name)) {
        echo "Error: Controller name cannot be empty.\n";
        return;
    }

    if (strpos($name, 'Controller') === false) {
        $name .= 'Controller';
    }

    $className = $name;
    $fileName = $className . '.php';
    $filePath = $backendDir . '/controller/' . $fileName;

    if (file_exists($filePath)) {
        echo "Error: Controller '{$fileName}' already exists.\n";
        return;
    }

    $modelName = str_replace('Controller', '', $className);
    $modelName .= 'Model';
    $variableName = lcfirst($modelName);

    $content = "<?php\n\n";
    $content .= "require_once __DIR__ . '/../model/{$modelName}.php';\n";
    $content .= "require_once __DIR__ . '/../config/jwt.php';\n\n";
    $content .= "class {$className} {\n";
    $content .= "    private \${$variableName};\n\n";
    $content .= "    public function __construct() {\n";
    $content .= "        \$this->{$variableName} = new {$modelName}();\n";
    $content .= "    }\n\n";
    $content .= "    /**\n";
    $content .= "     * Display a listing of the resource.\n";
    $content .= "     */\n";
    $content .= "    public function index() {\n";
    $content .= "        header('Content-Type: application/json');\n\n";
    $content .= "        \$headers = getallheaders();\n";
    $content .= "        \$token = isset(\$headers['Authorization']) ? str_replace('Bearer ', '', \$headers['Authorization']) : null;\n\n";
    $content .= "        if (!\$token || !JWT::validate(\$token)) {\n";
    $content .= "            http_response_code(401);\n";
    $content .= "            echo json_encode(['message' => 'Unauthorized']);\n";
    $content .= "            return;\n";
    $content .= "        }\n\n";
    $content .= "        \$result = \$this->{$variableName}->readAll();\n\n";
    $content .= "        if (\$result) {\n";
    $content .= "            http_response_code(200);\n";
    $content .= "            echo json_encode(['data' => \$result]);\n";
    $content .= "        } else {\n";
    $content .= "            http_response_code(404);\n";
    $content .= "            echo json_encode(['message' => 'No records found']);\n";
    $content .= "        }\n";
    $content .= "    }\n\n";
    $content .= "    /**\n";
    $content .= "     * Store a newly created resource in storage.\n";
    $content .= "     */\n";
    $content .= "    public function store() {\n";
    $content .= "        header('Content-Type: application/json');\n\n";
    $content .= "        \$headers = getallheaders();\n";
    $content .= "        \$token = isset(\$headers['Authorization']) ? str_replace('Bearer ', '', \$headers['Authorization']) : null;\n\n";
    $content .= "        if (!\$token || !JWT::validate(\$token)) {\n";
    $content .= "            http_response_code(401);\n";
    $content .= "            echo json_encode(['message' => 'Unauthorized']);\n";
    $content .= "            return;\n";
    $content .= "        }\n\n";
    $content .= "        \$data = json_decode(file_get_contents('php://input'), true);\n\n";
    $content .= "        if (!\$data) {\n";
    $content .= "            http_response_code(400);\n";
    $content .= "            echo json_encode(['message' => 'Invalid data']);\n";
    $content .= "            return;\n";
    $content .= "        }\n\n";
    $content .= "        \$result = \$this->{$variableName}->create(\$data);\n\n";
    $content .= "        if (\$result) {\n";
    $content .= "            http_response_code(201);\n";
    $content .= "            echo json_encode(['message' => 'Created successfully', 'id' => \$result]);\n";
    $content .= "        } else {\n";
    $content .= "            http_response_code(500);\n";
    $content .= "            echo json_encode(['message' => 'Failed to create']);\n";
    $content .= "        }\n";
    $content .= "    }\n\n";
    $content .= "    /**\n";
    $content .= "     * Display the specified resource.\n";
    $content .= "     */\n";
    $content .= "    public function show(\$id) {\n";
    $content .= "        header('Content-Type: application/json');\n\n";
    $content .= "        \$headers = getallheaders();\n";
    $content .= "        \$token = isset(\$headers['Authorization']) ? str_replace('Bearer ', '', \$headers['Authorization']) : null;\n\n";
    $content .= "        if (!\$token || !JWT::validate(\$token)) {\n";
    $content .= "            http_response_code(401);\n";
    $content .= "            echo json_encode(['message' => 'Unauthorized']);\n";
    $content .= "            return;\n";
    $content .= "        }\n\n";
    $content .= "        \$result = \$this->{$variableName}->readOne(\$id);\n\n";
    $content .= "        if (\$result) {\n";
    $content .= "            http_response_code(200);\n";
    $content .= "            echo json_encode(['data' => \$result]);\n";
    $content .= "        } else {\n";
    $content .= "            http_response_code(404);\n";
    $content .= "            echo json_encode(['message' => 'Record not found']);\n";
    $content .= "        }\n";
    $content .= "    }\n\n";
    $content .= "    /**\n";
    $content .= "     * Update the specified resource in storage.\n";
    $content .= "     */\n";
    $content .= "    public function update(\$id) {\n";
    $content .= "        header('Content-Type: application/json');\n\n";
    $content .= "        \$headers = getallheaders();\n";
    $content .= "        \$token = isset(\$headers['Authorization']) ? str_replace('Bearer ', '', \$headers['Authorization']) : null;\n\n";
    $content .= "        if (!\$token || !JWT::validate(\$token)) {\n";
    $content .= "            http_response_code(401);\n";
    $content .= "            echo json_encode(['message' => 'Unauthorized']);\n";
    $content .= "            return;\n";
    $content .= "        }\n\n";
    $content .= "        \$data = json_decode(file_get_contents('php://input'), true);\n\n";
    $content .= "        if (!\$data) {\n";
    $content .= "            http_response_code(400);\n";
    $content .= "            echo json_encode(['message' => 'Invalid data']);\n";
    $content .= "            return;\n";
    $content .= "        }\n\n";
    $content .= "        \$result = \$this->{$variableName}->update(\$id, \$data);\n\n";
    $content .= "        if (\$result) {\n";
    $content .= "            http_response_code(200);\n";
    $content .= "            echo json_encode(['message' => 'Updated successfully']);\n";
    $content .= "        } else {\n";
    $content .= "            http_response_code(500);\n";
    $content .= "            echo json_encode(['message' => 'Failed to update']);\n";
    $content .= "        }\n";
    $content .= "    }\n\n";
    $content .= "    /**\n";
    $content .= "     * Remove the specified resource from storage.\n";
    $content .= "     */\n";
    $content .= "    public function destroy(\$id) {\n";
    $content .= "        header('Content-Type: application/json');\n\n";
    $content .= "        \$headers = getallheaders();\n";
    $content .= "        \$token = isset(\$headers['Authorization']) ? str_replace('Bearer ', '', \$headers['Authorization']) : null;\n\n";
    $content .= "        if (!\$token || !JWT::validate(\$token)) {\n";
    $content .= "            http_response_code(401);\n";
    $content .= "            echo json_encode(['message' => 'Unauthorized']);\n";
    $content .= "            return;\n";
    $content .= "        }\n\n";
    $content .= "        \$result = \$this->{$variableName}->delete(\$id);\n\n";
    $content .= "        if (\$result) {\n";
    $content .= "            http_response_code(200);\n";
    $content .= "            echo json_encode(['message' => 'Deleted successfully']);\n";
    $content .= "        } else {\n";
    $content .= "            http_response_code(500);\n";
    $content .= "            echo json_encode(['message' => 'Failed to delete']);\n";
    $content .= "        }\n";
    $content .= "    }\n";
    $content .= "}\n";

    if (file_put_contents($filePath, $content)) {
        echo "✓ Controller '{$fileName}' created successfully at: {$filePath}\n";
    } else {
        echo "✗ Failed to create controller '{$fileName}'.\n";
    }
}
