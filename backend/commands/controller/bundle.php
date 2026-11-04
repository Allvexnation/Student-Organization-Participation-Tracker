<?php

function makeBundle($backendDir) {
    echo "\n--- Make Bundle (Controller + Model + Route) ---\n";
    echo "Resource name (e.g., User, Product, Hello): ";
    $name = trim(fgets(STDIN));

    if (empty($name)) {
        echo "Error: Resource name cannot be empty.\n";
        return;
    }

    echo "Create subfolder for all files? (y/n): ";
    $useSubfolder = strtolower(trim(fgets(STDIN))) === 'y';

    $folderName = '';
    if ($useSubfolder) {
        echo "Folder name (default: {$name}): ";
        $folderInput = trim(fgets(STDIN));
        $folderName = $folderInput ?: $name;
    }

    $controllerName = $name . 'Controller';

    $controllerPath = $backendDir . '/controller';
    if ($useSubfolder) {
        $controllerPath .= '/' . $folderName;
        if (!is_dir($controllerPath)) {
            mkdir($controllerPath, 0755, true);
            echo "✓ Created subfolder: {$controllerPath}\n";
        }
    }

    $modelPath = $backendDir . '/model';
    if ($useSubfolder) {
        $modelPath .= '/' . $folderName;
        if (!is_dir($modelPath)) {
            mkdir($modelPath, 0755, true);
            echo "✓ Created subfolder: {$modelPath}\n";
        }
    }

    $routePath = $backendDir . '/routes';
    if ($useSubfolder) {
        $routePath .= '/' . $folderName;
        if (!is_dir($routePath)) {
            mkdir($routePath, 0755, true);
            echo "✓ Created subfolder: {$routePath}\n";
        }
    }

    $controllerFile = $controllerPath . '/' . $controllerName . '.php';
    if (!file_exists($controllerFile)) {
        $controllerContent = generateController($controllerName, $modelName, $useSubfolder ? $folderName : '');
        if (file_put_contents($controllerFile, $controllerContent)) {
            echo "✓ Controller created: {$controllerFile}\n";
        } else {
            echo "✗ Failed to create controller\n";
        }
    } else {
        echo "⚠ Controller already exists: {$controllerFile}\n";
    }

    $modelFile = $modelPath . '/' . $modelName . '.php';
    if (!file_exists($modelFile)) {
        $modelContent = generateModel($modelName, $name);
        if (file_put_contents($modelFile, $modelContent)) {
            echo "✓ Model created: {$modelFile}\n";
        } else {
            echo "✗ Failed to create model\n";
        }
    } else {
        echo "⚠ Model already exists: {$modelFile}\n";
    }

    $routeFile = $routePath . '/' . $routeName . '.php';
    if (!file_exists($routeFile)) {
        $routeContent = generateRoute($routeName, $controllerName, $useSubfolder ? $folderName : '', $name);
        if (file_put_contents($routeFile, $routeContent)) {
            echo "✓ Route created: {$routeFile}\n";
        } else {
            echo "✗ Failed to create route\n";
        }
    } else {
        echo "⚠ Route already exists: {$routeFile}\n";
    }

    echo "\nBundle creation complete!\n";
}

function generateController($controllerName, $modelName, $subfolder) {
    $variableName = lcfirst($modelName);
    $modelPath = $subfolder ? "../model/{$subfolder}/{$modelName}.php" : "../model/{$modelName}.php";

    $content = "<?php\n\n";
    $content .= "require_once __DIR__ . '/{$modelPath}';\n";
    $content .= "require_once __DIR__ . '/../config/jwt.php';\n\n";
    $content .= "class {$controllerName} {\n";
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

    return $content;
}

function generateModel($modelName, $resourceName) {
    $tableName = strtolower($resourceName) . 's';

    $content = "<?php\n\n";
    $content .= "require_once __DIR__ . '/../config/db.php';\n\n";
    $content .= "class {$modelName} {\n";
    $content .= "    private \$conn;\n";
    $content .= "    private \$table = '{$tableName}';\n\n";
    $content .= "    public function __construct() {\n";
    $content .= "        \$database = new Database();\n";
    $content .= "        \$this->conn = \$database->getConnection();\n";
    $content .= "    }\n\n";
    $content .= "    /**\n";
    $content .= "     * Get all records\n";
    $content .= "     */\n";
    $content .= "    public function readAll() {\n";
    $content .= "        \$query = \"SELECT * FROM \" . \$this->table;\n";
    $content .= "        \$stmt = \$this->conn->prepare(\$query);\n";
    $content .= "        \$stmt->execute();\n";
    $content .= "        return \$stmt->fetchAll(PDO::FETCH_ASSOC);\n";
    $content .= "    }\n\n";
    $content .= "    /**\n";
    $content .= "     * Get single record by ID\n";
    $content .= "     */\n";
    $content .= "    public function readOne(\$id) {\n";
    $content .= "        \$query = \"SELECT * FROM \" . \$this->table . \" WHERE id = :id LIMIT 0,1\";\n";
    $content .= "        \$stmt = \$this->conn->prepare(\$query);\n";
    $content .= "        \$stmt->bindParam(':id', \$id);\n";
    $content .= "        \$stmt->execute();\n";
    $content .= "        return \$stmt->fetch(PDO::FETCH_ASSOC);\n";
    $content .= "    }\n\n";
    $content .= "    /**\n";
    $content .= "     * Create new record\n";
    $content .= "     */\n";
    $content .= "    public function create(\$data) {\n";
    $content .= "        \$query = \"INSERT INTO \" . \$this->table . \" SET \";\n\n";
    $content .= "        \$fields = array_keys(\$data);\n";
    $content .= "        \$placeholders = array_map(function(\$field) { return ':' . \$field; }, \$fields);\n\n";
    $content .= "        \$query .= implode(', ', array_map(function(\$field) { return \$field . ' = :' . \$field; }, \$fields));\n\n";
    $content .= "        \$stmt = \$this->conn->prepare(\$query);\n\n";
    $content .= "        foreach (\$data as \$key => \$value) {\n";
    $content .= "            \$stmt->bindParam(':' . \$key, \$value);\n";
    $content .= "        }\n\n";
    $content .= "        if (\$stmt->execute()) {\n";
    $content .= "            return \$this->conn->lastInsertId();\n";
    $content .= "        }\n\n";
    $content .= "        return false;\n";
    $content .= "    }\n\n";
    $content .= "    /**\n";
    $content .= "     * Update record\n";
    $content .= "     */\n";
    $content .= "    public function update(\$id, \$data) {\n";
    $content .= "        \$query = \"UPDATE \" . \$this->table . \" SET \";\n\n";
    $content .= "        \$fields = array_keys(\$data);\n";
    $content .= "        \$query .= implode(', ', array_map(function(\$field) { return \$field . ' = :' . \$field; }, \$fields));\n";
    $content .= "        \$query .= \" WHERE id = :id\";\n\n";
    $content .= "        \$stmt = \$this->conn->prepare(\$query);\n\n";
    $content .= "        foreach (\$data as \$key => \$value) {\n";
    $content .= "            \$stmt->bindParam(':' . \$key, \$value);\n";
    $content .= "        }\n\n";
    $content .= "        \$stmt->bindParam(':id', \$id);\n\n";
    $content .= "        if (\$stmt->execute()) {\n";
    $content .= "            return true;\n";
    $content .= "        }\n\n";
    $content .= "        return false;\n";
    $content .= "    }\n\n";
    $content .= "    /**\n";
    $content .= "     * Delete record\n";
    $content .= "     */\n";
    $content .= "    public function delete(\$id) {\n";
    $content .= "        \$query = \"DELETE FROM \" . \$this->table . \" WHERE id = :id\";\n";
    $content .= "        \$stmt = \$this->conn->prepare(\$query);\n";
    $content .= "        \$stmt->bindParam(':id', \$id);\n\n";
    $content .= "        if (\$stmt->execute()) {\n";
    $content .= "            return true;\n";
    $content .= "        }\n\n";
    $content .= "        return false;\n";
    $content .= "    }\n";
    $content .= "}\n";

    return $content;
}

function generateRoute($routeName, $controllerName, $controllerSubfolder, $resourceName) {
    $controllerPath = $controllerSubfolder ? "../controller/{$controllerSubfolder}/{$controllerName}.php" : "../controller/{$controllerName}.php";
    $resourceNameLower = strtolower($resourceName);

    $content = "<?php\n\n";
    $content .= "require_once __DIR__ . '/{$controllerPath}';\n\n";
    $content .= "class {$routeName} {\n";
    $content .= "    private \$controller;\n\n";
    $content .= "    public function __construct() {\n";
    $content .= "        \$this->controller = new {$controllerName}();\n";
    $content .= "    }\n\n";
    $content .= "    public function handle(\$method, \$uri) {\n";
    $content .= "        \$uri = rtrim(\$uri, '/');\n\n";
    $content .= "        if (\$method === 'GET' && \$uri === '/api/{$resourceNameLower}') {\n";
    $content .= "            \$this->controller->index();\n";
    $content .= "        } elseif (\$method === 'POST' && \$uri === '/api/{$resourceNameLower}') {\n";
    $content .= "            \$this->controller->store();\n";
    $content .= "        } elseif (\$method === 'GET' && preg_match('#^/api/{$resourceNameLower}/(\d+)$#', \$uri, \$matches)) {\n";
    $content .= "            \$this->controller->show(\$matches[1]);\n";
    $content .= "        } elseif (\$method === 'PUT' && preg_match('#^/api/{$resourceNameLower}/(\d+)$#', \$uri, \$matches)) {\n";
    $content .= "            \$this->controller->update(\$matches[1]);\n";
    $content .= "        } elseif (\$method === 'DELETE' && preg_match('#^/api/{$resourceNameLower}/(\d+)$#', \$uri, \$matches)) {\n";
    $content .= "            \$this->controller->destroy(\$matches[1]);\n";
    $content .= "        } else {\n";
    $content .= "            http_response_code(404);\n";
    $content .= "            echo json_encode(['message' => 'Route not found']);\n";
    $content .= "        }\n";
    $content .= "    }\n";
    $content .= "}\n";

    return $content;
}
