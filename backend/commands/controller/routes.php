<?php

function makeRoute($backendDir) {
    echo "\n--- Make Route ---\n";
    echo "Route name (e.g., User, Product, Admin): ";
    $name = trim(fgets(STDIN));

    if (empty($name)) {
        echo "Error: Route name cannot be empty.\n";
        return;
    }

    if (strpos($name, 'Routes') === false) {
        $name .= 'Routes';
    }

    $className = $name;
    $fileName = $className . '.php';
    $filePath = $backendDir . '/routes/' . $fileName;

    if (file_exists($filePath)) {
        echo "Error: Route '{$fileName}' already exists.\n";
        return;
    }

    $controllerName = str_replace('Routes', 'Controller', $className);
    $resourceName = strtolower(str_replace('Routes', '', $className));

    $content = "<?php\n\n";
    $content .= "require_once __DIR__ . '/../controller/{$controllerName}.php';\n\n";
    $content .= "class {$className} {\n";
    $content .= "    private \$controller;\n\n";
    $content .= "    public function __construct() {\n";
    $content .= "        \$this->controller = new {$controllerName}();\n";
    $content .= "    }\n\n";
    $content .= "    public function handle(\$method, \$uri) {\n";
    $content .= "        \$uri = rtrim(\$uri, '/');\n\n";
    $content .= "        if (\$method === 'GET' && \$uri === '/api/{$resourceName}') {\n";
    $content .= "            \$this->controller->index();\n";
    $content .= "        } elseif (\$method === 'POST' && \$uri === '/api/{$resourceName}') {\n";
    $content .= "            \$this->controller->store();\n";
    $content .= "        } elseif (\$method === 'GET' && preg_match('#^/api/{$resourceName}/(\d+)$#', \$uri, \$matches)) {\n";
    $content .= "            \$this->controller->show(\$matches[1]);\n";
    $content .= "        } elseif (\$method === 'PUT' && preg_match('#^/api/{$resourceName}/(\d+)$#', \$uri, \$matches)) {\n";
    $content .= "            \$this->controller->update(\$matches[1]);\n";
    $content .= "        } elseif (\$method === 'DELETE' && preg_match('#^/api/{$resourceName}/(\d+)$#', \$uri, \$matches)) {\n";
    $content .= "            \$this->controller->destroy(\$matches[1]);\n";
    $content .= "        } else {\n";
    $content .= "            http_response_code(404);\n";
    $content .= "            echo json_encode(['message' => 'Route not found']);\n";
    $content .= "        }\n";
    $content .= "    }\n";
    $content .= "}\n";

    if (file_put_contents($filePath, $content)) {
        echo "✓ Route '{$fileName}' created successfully at: {$filePath}\n";
        echo "  Remember to add the route handler to your index.php file.\n";
    } else {
        echo "✗ Failed to create route '{$fileName}'.\n";
    }
}
