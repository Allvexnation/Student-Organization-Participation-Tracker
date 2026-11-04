<?php

function makeModel($backendDir) {
    echo "\n--- Make Model ---\n";
    echo "Model name (e.g., User, Product): ";
    $name = trim(fgets(STDIN));

    if (empty($name)) {
        echo "Error: Model name cannot be empty.\n";
        return;
    }

    if (strpos($name, 'Model') === false) {
        $name .= 'Model';
    }

    $className = $name;
    $fileName = $className . '.php';
    $filePath = $backendDir . '/model/' . $fileName;

    if (file_exists($filePath)) {
        echo "Error: Model '{$fileName}' already exists.\n";
        return;
    }

    $tableName = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', str_replace('Model', '', $className)));
    $tableName .= 's';

    $content = "<?php\n\n";
    $content .= "require_once __DIR__ . '/../config/db.php';\n\n";
    $content .= "class {$className} {\n";
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

    if (file_put_contents($filePath, $content)) {
        echo "✓ Model '{$fileName}' created successfully at: {$filePath}\n";
    } else {
        echo "✗ Failed to create model '{$fileName}'.\n";
    }
}
