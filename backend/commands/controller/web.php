<?php

require_once __DIR__ . '/../components/header.php';
require_once __DIR__ . '/../components/loading.php';

function formatBytes($bytes, $precision = 1) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}

function promptForAssets($backendDir, $currentAssets = []) {
    $filesDir = $backendDir . '/template/Updates/Files';

    if (!is_dir($filesDir)) {
        @mkdir($filesDir, 0777, true);
    }

    $allFiles = scandir($filesDir);
    $assetFiles = array_diff($allFiles, ['.', '..']);

    if (empty($assetFiles)) {
        echo "\n\033[0;33m[Notice] No files found in template/Updates/Files directory.\033[0m\n";
        echo "\033[0;37m(Place your .zip packages or documentation in:\033[0m {$filesDir}\033[0;37m)\033[0m\n";
        return [];
    }

    echo "\n\033[1;34mAvailable assets in template/Updates/Files:\033[0m\n";
    $index = 1;
    $fileMap = [];

    foreach ($assetFiles as $file) {
        $filePath = $filesDir . '/' . $file;
        $size = is_file($filePath) ? formatBytes(filesize($filePath)) : 'unknown';
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $typeTag = ($ext === 'zip') ? "\033[1;32m[ZIP]\033[0m" : "\033[1;36m[DOC]\033[0m";

        echo "  \033[0;33m{$index}.\033[0m {$typeTag} {$file} \033[0;37m({$size})\033[0m\n";
        $fileMap[$index] = $file;
        $index++;
    }

    echo "\n\033[1;34mSelect assets to attach (comma-separated numbers e.g. 1,2, 'all' for all, or press Enter to skip):\033[0m ";
    $input = trim(fgets(STDIN));

    if (empty($input)) {
        return [];
    }

    $selectedFiles = [];

    if (strtolower($input) === 'all') {
        foreach ($fileMap as $file) {
            $selectedFiles[] = $file;
        }
    } else {
        $choices = explode(',', $input);
        foreach ($choices as $c) {
            $num = trim($c);
            if (isset($fileMap[$num])) {
                $selectedFiles[] = $fileMap[$num];
            }
        }
    }

    $assetsList = [];
    foreach ($selectedFiles as $fileName) {
        $filePath = $filesDir . '/' . $fileName;
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $isZip = ($ext === 'zip');
        $sizeBytes = is_file($filePath) ? filesize($filePath) : 0;

        $assetsList[] = [
            'name' => $fileName,
            'type' => $isZip ? 'zip' : 'documentation',
            'size' => formatBytes($sizeBytes),
            'size_bytes' => $sizeBytes,
            'download_url' => '/api/web/updates/download?file=' . urlencode($fileName)
        ];
    }

    return $assetsList;
}

function promptForCombinedAssets($backendDir) {
    $filesDir = $backendDir . '/template/Updates/Files';

    if (!is_dir($filesDir)) {
        @mkdir($filesDir, 0777, true);
    }

    $allFiles = scandir($filesDir);
    $assetFiles = array_diff($allFiles, ['.', '..']);

    if (empty($assetFiles)) {
        echo "\n\033[0;33m[Notice] No files found in template/Updates/Files directory.\033[0m\n";
        echo "\033[0;37m(Place your .zip packages or documentation in:\033[0m {$filesDir}\033[0;37m)\033[0m\n";
        return ['templateAssets' => [], 'cloudinaryFiles' => []];
    }

    echo "\n\033[1;34mAvailable files in template/Updates/Files:\033[0m\n";
    $index = 1;
    $fileMap = [];

    foreach ($assetFiles as $file) {
        $filePath = $filesDir . '/' . $file;
        $size = is_file($filePath) ? formatBytes(filesize($filePath)) : 'unknown';
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $typeTag = ($ext === 'zip') ? "\033[1;32m[ZIP]\033[0m" : "\033[1;36m[DOC]\033[0m";

        echo "  \033[0;33m{$index}.\033[0m {$typeTag} {$file} \033[0;37m({$size})\033[0m\n";
        $fileMap[$index] = $file;
        $index++;
    }

    echo "\n\033[1;34mSelect files (comma-separated numbers e.g. 1,2, 'all' for all, or press Enter to skip):\033[0m ";
    $input = trim(fgets(STDIN));

    if (empty($input)) {
        return ['templateAssets' => [], 'cloudinaryFiles' => []];
    }

    $selectedFiles = [];

    if (strtolower($input) === 'all') {
        foreach ($fileMap as $file) {
            $selectedFiles[] = $file;
        }
    } else {
        $choices = explode(',', $input);
        foreach ($choices as $c) {
            $num = trim($c);
            if (isset($fileMap[$num])) {
                $selectedFiles[] = $fileMap[$num];
            }
        }
    }

    return ['templateAssets' => $selectedFiles, 'cloudinaryFiles' => $selectedFiles];
}

function checkConnections($backendDir) {
    echo "\n\033[1;36m=== Checking Connections ===\033[0m\n\n";

    echo "\033[1;34mChecking Database Connection...\033[0m\n";
    showLoadingBar("Connecting to Database", 5);
    require_once __DIR__ . '/../../config/db.php';
    try {
        $db = Database::getInstance();
        $health = $db->getHealthStatus();
        if ($health['status'] === 'healthy') {
            echo "\033[1;32m✓ Database Connected\033[0m\n";
            echo "   Host: {$health['host']}:{$health['port']}\n";
            echo "   Database: {$db->getDatabaseName()}\n";
        } else {
            echo "\033[0;31m✗ Database Connection Failed: {$health['message']}\033[0m\n";
            return false;
        }
    } catch (Exception $e) {
        echo "\033[0;31m✗ Database Connection Failed: " . $e->getMessage() . "\033[0m\n";
        return false;
    }

    echo "\n\033[1;34mChecking Cloudinary Connection...\033[0m\n";
    showLoadingBar("Connecting to Cloudinary", 5);
    require_once __DIR__ . '/../config/cloudinary.php';
    try {
        CloudinaryConfig::init();
        echo "\033[1;32m✓ Cloudinary Configured\033[0m\n";
    } catch (Exception $e) {
        echo "\033[0;31m✗ Cloudinary Configuration Failed: " . $e->getMessage() . "\033[0m\n";
        return false;
    }

    echo "\n\033[1;32m✓ All connections verified successfully\033[0m\n\n";
    return true;
}

function showWebMenu($backendDir) {
    while (true) {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            system('cls');
        } else {
            system('clear');
        }
        showHeader('web');
        echo "  \033[0;33m1.\033[0m Update the website (Create Release)\n";
        echo "  \033[0;33m2.\033[0m Edit existing update\n";
        echo "  \033[0;33m3.\033[0m Delete an update\n";
        echo "  \033[0;31m0.\033[0m Back to main menu\n";
        echo "\n";
        echo "\033[1;34mChoice:\033[0m ";

        $choice = trim(fgets(STDIN));

        switch ($choice) {
            case '1':
                if (checkConnections($backendDir)) {
                    updateWebsite($backendDir);
                } else {
                    showError("Connection check failed. Cannot proceed.");
                    sleep(2);
                }
                break;

            case '2':
                if (checkConnections($backendDir)) {
                    editUpdate($backendDir);
                } else {
                    showError("Connection check failed. Cannot proceed.");
                    sleep(2);
                }
                break;

            case '3':
                if (checkConnections($backendDir)) {
                    deleteUpdatePrompt($backendDir);
                } else {
                    showError("Connection check failed. Cannot proceed.");
                    sleep(2);
                }
                break;

            case '0':
                return;

            default:
                showError("Invalid choice. Please try again.");
                sleep(2);
                continue 2;
        }

        echo "\n\033[1;34mPress Enter to continue:\033[0m ";
        fgets(STDIN);
    }
}

function updateWebsite($backendDir) {
    require_once __DIR__ . '/../../model/web/UpdatesModel.php';
    
    $updatesModel = new UpdatesModel();
    
    echo "\n\033[1;36m=== Update Website (Create Release) ===\033[0m\n\n";

    echo "\033[1;34mEnter version number (e.g., 1.0.0 or 2.7.0):\033[0m ";
    $version = trim(fgets(STDIN));
    
    if (empty($version)) {
        showError("Version number is required.");
        return;
    }

    echo "\033[1;34mEnter update / release title:\033[0m ";
    $name = trim(fgets(STDIN));
    
    if (empty($name)) {
        showError("Update name is required.");
        return;
    }

    echo "\033[1;34mEnter branch name (press Enter for 'main'):\033[0m ";
    $branch = trim(fgets(STDIN));
    if (empty($branch)) {
        $branch = 'main';
    }

    echo "\033[1;34mEnter GitHub branch link (press Enter to skip):\033[0m ";
    $githubBranchLink = trim(fgets(STDIN));
    if (empty($githubBranchLink)) {
        $githubBranchLink = null;
    }

    echo "\n\033[1;34mReadme / Release Notes source:\033[0m\n";
    echo "  \033[0;33m1.\033[0m Enter manually\n";
    echo "  \033[0;33m2.\033[0m Choose from template directory (template/Updates)\n";
    echo "\n";
    echo "\033[1;34mChoice:\033[0m ";
    $readmeChoice = trim(fgets(STDIN));
    
    $readmeContent = "";
    $readmeFilename = null;
    
    if ($readmeChoice === '1') {
        echo "\033[1;34mEnter readme content:\033[0m ";
        $readmeContent = trim(fgets(STDIN));
        
        if (empty($readmeContent)) {
            showError("Readme content is required.");
            return;
        }
    } elseif ($readmeChoice === '2') {
        $templateDir = $backendDir . '/template/Updates/Versions';
        
        if (!is_dir($templateDir)) {
            showError("Template directory does not exist.");
            return;
        }
        
        $files = scandir($templateDir);
        $files = array_diff($files, ['.', '..', 'Files']);
        
        if (empty($files)) {
            showError("No template markdown files found in template/Updates directory.");
            return;
        }
        
        echo "\n\033[1;34mAvailable template files:\033[0m\n";
        $index = 1;
        $fileMap = [];
        
        foreach ($files as $file) {
            echo "  \033[0;33m{$index}.\033[0m {$file}\n";
            $fileMap[$index] = $file;
            $index++;
        }
        
        echo "\n\033[1;34mSelect a file (number):\033[0m ";
        $fileChoice = trim(fgets(STDIN));
        
        if (!isset($fileMap[$fileChoice])) {
            showError("Invalid file selection.");
            return;
        }
        
        $selectedFile = $templateDir . '/' . $fileMap[$fileChoice];
        $readmeContent = file_get_contents($selectedFile);
        $readmeFilename = $fileMap[$fileChoice];
        
        if ($readmeContent === false) {
            showError("Failed to read template file.");
            return;
        }
        
        echo "\n\033[1;32mLoaded readme from: {$fileMap[$fileChoice]}\033[0m\n";
    } else {
        showError("Invalid choice.");
        return;
    }

    $selectedAssets = promptForCombinedAssets($backendDir);
    $assets = [];
    $selectedCloudinaryFiles = $selectedAssets['cloudinaryFiles'];

    echo "\n\033[1;34mDo you want to include assets for this update?\033[0m\n";
    echo "  \033[0;33m1.\033[0m Yes, include assets\n";
    echo "  \033[0;33m2.\033[0m No, set assets to null (no assets available)\n";
    echo "\n\033[1;34mChoice:\033[0m ";
    $includeAssetsChoice = trim(fgets(STDIN));

    if ($includeAssetsChoice === '2') {
        $assets = [];
        $selectedCloudinaryFiles = [];
    } else {
        $filesDir = $backendDir . '/template/Updates/Files';
        foreach ($selectedAssets['templateAssets'] as $fileName) {
            $filePath = $filesDir . '/' . $fileName;
            if (file_exists($filePath)) {
                $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                $isZip = ($ext === 'zip');
                $fileSize = filesize($filePath);
                $assets[] = [
                    'name' => $fileName,
                    'type' => $isZip ? 'zip' : 'documentation',
                    'size' => formatBytes($fileSize),
                    'size_bytes' => $fileSize,
                    'download_url' => '/api/web/updates/download?file=' . urlencode($fileName)
                ];
            }
        }
    }

    echo "\n\033[1;34mClosable type:\033[0m\n";
    echo "  \033[0;33m1.\033[0m Closable (modal popup with dismiss on other pages)\n";
    echo "  \033[0;33m2.\033[0m Not closable (locks system, redirects to /updates full page)\n";
    echo "  \033[0;33m3.\033[0m Show once (modal popup shown once per user on other pages)\n";
    echo "\n";
    echo "\033[1;34mChoice:\033[0m ";
    $closableChoice = trim(fgets(STDIN));
    
    $closableType = "closable";
    switch ($closableChoice) {
        case '1':
            $closableType = "closable";
            break;
        case '2':
            $closableType = "not_closable";
            break;
        case '3':
            $closableType = "show_once";
            break;
        default:
            showWarning("Defaulting to closable.");
            $closableType = "closable";
    }

    echo "\n\033[1;36m=== Review Update Details ===\033[0m\n";
    echo "\033[1;34mVersion:\033[0m         v{$version}\n";
    echo "\033[1;34mTitle:\033[0m           {$name}\n";
    echo "\033[1;34mBranch:\033[0m          {$branch}\n";
    echo "\033[1;34mGitHub Link:\033[0m      " . ($githubBranchLink ? $githubBranchLink : "None") . "\n";
    echo "\033[1;34mReadme Source:\033[0m   " . ($readmeFilename ? $readmeFilename : "Manual entry") . "\n";
    echo "\033[1;34mAttached Assets:\033[0m " . (count($assets) > 0 ? count($assets) . " file(s)" : "None") . "\n";
    foreach ($assets as $a) {
        echo "   - {$a['name']} ({$a['size']}) [{$a['type']}]\n";
    }
    echo "\033[1;34mCloudinary Upload:\033[0m " . (count($selectedCloudinaryFiles) > 0 ? count($selectedCloudinaryFiles) . " file(s) to upload" : "None") . "\n";
    foreach ($selectedCloudinaryFiles as $cf) {
        echo "   - {$cf}\n";
    }
    echo "\033[1;34mClosable Type:\033[0m   {$closableType}\n";
    echo "\n";
    echo "\033[1;34mPublish this update? (y/n):\033[0m ";
    $confirm = trim(fgets(STDIN));
    
    if (strtolower($confirm) !== 'y') {
        showWarning("Update creation cancelled.");
        return;
    }

    $uploadedFiles = [];
    if (!empty($selectedCloudinaryFiles)) {
        require_once __DIR__ . '/../config/cloudinary.php';
        $filesDir = $backendDir . '/template/Updates/Files';

        echo "\n\033[1;34mUploading files to Cloudinary...\033[0m\n";
        $totalFiles = count($selectedCloudinaryFiles);
        $currentFile = 0;

        foreach ($selectedCloudinaryFiles as $fileName) {
            $currentFile++;
            $assetFilePath = $filesDir . '/' . $fileName;
            if (file_exists($assetFilePath)) {
                $fileSize = filesize($assetFilePath);
                echo "\033[1;33m[{$currentFile}/{$totalFiles}] Uploading: {$fileName} (" . formatBytes($fileSize) . ")\033[0m\n";

                $cloudinaryMaxSize = 10485760;
                if ($fileSize > $cloudinaryMaxSize) {
                    echo "\033[0;31m✗ File size exceeds Cloudinary's 10 MB limit (" . formatBytes($fileSize) . " > 10 MB)\033[0m\n";
                    echo "\033[0;37mSkipping Cloudinary upload. File will be available via local download URL.\033[0m\n";
                    continue;
                }

                showLoadingBar("Uploading", 5);

                try {
                    $assetFileUrl = CloudinaryConfig::uploadFile($assetFilePath, 'updates');
                    $uploadedFiles[] = $assetFileUrl;
                    
                    echo "\033[1;32m✓ Upload successful\033[0m\n";
                } catch (Exception $e) {
                    echo "\033[0;31m✗ Upload failed: " . $e->getMessage() . "\033[0m\n";
                    echo "\033[0;37mSkipping this file.\033[0m\n";
                }
            }
        }
    }

    $updateData = [
        'version' => $version,
        'name' => $name,
        'branch' => $branch,
        'github_branch_link' => $githubBranchLink,
        'readme_content' => $readmeContent,
        'readme_filename' => $readmeFilename,
        'assets' => !empty($assets) ? json_encode($assets) : null,
        'assets_file' => !empty($uploadedFiles) ? implode(',', $uploadedFiles) : null,
        'is_updated' => 0,
        'closable_type' => $closableType,
        'is_active' => 1
    ];
    
    $result = $updatesModel->create($updateData);
    
    if ($result) {
        showSuccess("Update published successfully with ID: {$result}");
        echo "\n\033[1;32mThe update is now live on the frontend (Branch: {$branch}, Assets: " . count($assets) . ").\033[0m\n";
    } else {
        showError("Failed to create update.");
    }
}

function editUpdate($backendDir) {
    require_once __DIR__ . '/../../model/web/UpdatesModel.php';

    $updatesModel = new UpdatesModel();

    echo "\n\033[1;36m=== Edit Existing Update ===\033[0m\n\n";

    $updates = $updatesModel->readAll();

    if (!$updates || empty($updates)) {
        showWarning("No updates found. Create an update first.");
        return;
    }

    echo "\033[1;34mAvailable updates:\033[0m\n";
    $index = 1;
    $updateMap = [];

    foreach ($updates as $update) {
        $branchInfo = !empty($update['branch']) ? $update['branch'] : 'main';
        $assetsArr = !empty($update['assets']) ? (is_array($update['assets']) ? $update['assets'] : json_decode($update['assets'], true)) : [];
        $assetCount = is_array($assetsArr) ? count($assetsArr) : 0;
        $updatedTag = !empty($update['is_updated']) ? " \033[1;35m[Edited]\033[0m" : "";

        echo "  \033[0;33m{$index}.\033[0m ID: {$update['id']} | v{$update['version']} ({$branchInfo}) | {$update['name']} | Closable: {$update['closable_type']} | Assets: {$assetCount}{$updatedTag}\n";
        $updateMap[$index] = $update;
        $index++;
    }

    echo "\n";
    echo "\033[1;34mSelect an update to edit (number):\033[0m ";
    $choice = trim(fgets(STDIN));

    if (!isset($updateMap[$choice])) {
        showError("Invalid selection.");
        return;
    }

    $selectedUpdate = $updateMap[$choice];
    $currentAssets = !empty($selectedUpdate['assets']) ? (is_array($selectedUpdate['assets']) ? $selectedUpdate['assets'] : json_decode($selectedUpdate['assets'], true)) : [];
    if (!is_array($currentAssets)) $currentAssets = [];

    echo "\n\033[1;36m=== Editing Update ID: {$selectedUpdate['id']} ===\033[0m\n";
    echo "\033[1;34mCurrent Version:\033[0m       {$selectedUpdate['version']}\n";
    echo "\033[1;34mCurrent Name:\033[0m          {$selectedUpdate['name']}\n";
    echo "\033[1;34mCurrent Branch:\033[0m        " . (!empty($selectedUpdate['branch']) ? $selectedUpdate['branch'] : 'main') . "\n";
    echo "\033[1;34mCurrent GitHub Link:\033[0m   " . (!empty($selectedUpdate['github_branch_link']) ? $selectedUpdate['github_branch_link'] : 'None') . "\n";
    echo "\033[1;34mCurrent Closable:\033[0m      {$selectedUpdate['closable_type']}\n";
    echo "\033[1;34mCurrent Assets:\033[0m        " . count($currentAssets) . " attached\n";
    foreach ($currentAssets as $ca) {
        echo "   - {$ca['name']} ({$ca['size']})\n";
    }
    echo "\033[1;34mStatus:\033[0m                " . (!empty($selectedUpdate['is_active']) ? 'Active' : 'Inactive') . "\n";
    echo "\n";

    echo "\033[1;34mWhat would you like to edit?\033[0m\n";
    echo "  \033[0;33m1.\033[0m Version only\n";
    echo "  \033[0;33m2.\033[0m Title / Name only\n";
    echo "  \033[0;33m3.\033[0m Branch only\n";
    echo "  \033[0;33m4.\033[0m GitHub branch link only\n";
    echo "  \033[0;33m5.\033[0m Readme content only\n";
    echo "  \033[0;33m6.\033[0m Assets only (Select from template/Updates/Files)\n";
    echo "  \033[0;33m7.\033[0m Upload asset file only\n";
    echo "  \033[0;33m8.\033[0m Closable type only\n";
    echo "  \033[0;33m9.\033[0m Active status only\n";
    echo "  \033[0;33m10.\033[0m All fields\n";
    echo "\n";
    echo "\033[1;34mChoice:\033[0m ";
    $editChoice = trim(fgets(STDIN));

    $updateData = [
        'version' => $selectedUpdate['version'],
        'name' => $selectedUpdate['name'],
        'branch' => !empty($selectedUpdate['branch']) ? $selectedUpdate['branch'] : 'main',
        'github_branch_link' => $selectedUpdate['github_branch_link'] ?? null,
        'readme_content' => $selectedUpdate['readme_content'],
        'readme_filename' => $selectedUpdate['readme_filename'],
        'assets' => $currentAssets,
        'assets_file' => $selectedUpdate['assets_file'] ?? null,
        'closable_type' => $selectedUpdate['closable_type'],
        'is_active' => $selectedUpdate['is_active'],
        'is_updated' => 1
    ];

    if ($editChoice === '1') {
        echo "\033[1;34mEnter new version (current: {$selectedUpdate['version']}):\033[0m ";
        $newVersion = trim(fgets(STDIN));
        if (!empty($newVersion)) {
            $updateData['version'] = $newVersion;
        }
    } elseif ($editChoice === '2') {
        echo "\033[1;34mEnter new title (current: {$selectedUpdate['name']}):\033[0m ";
        $newName = trim(fgets(STDIN));
        if (!empty($newName)) {
            $updateData['name'] = $newName;
        }
    } elseif ($editChoice === '3') {
        $curBranch = !empty($selectedUpdate['branch']) ? $selectedUpdate['branch'] : 'main';
        echo "\033[1;34mEnter new branch (current: {$curBranch}):\033[0m ";
        $newBranch = trim(fgets(STDIN));
        if (!empty($newBranch)) {
            $updateData['branch'] = $newBranch;
        }
    } elseif ($editChoice === '4') {
        $curGithubLink = $selectedUpdate['github_branch_link'] ?? 'None';
        echo "\033[1;34mEnter new GitHub branch link (current: {$curGithubLink}):\033[0m ";
        $newGithubLink = trim(fgets(STDIN));
        if (!empty($newGithubLink)) {
            $updateData['github_branch_link'] = $newGithubLink;
        } else {
            $updateData['github_branch_link'] = null;
        }
    } elseif ($editChoice === '5') {
        echo "\033[1;34mReadme source:\033[0m\n";
        echo "  \033[0;33m1.\033[0m Enter manually\n";
        echo "  \033[0;33m2.\033[0m Choose from template directory\n";
        echo "\033[1;34mChoice:\033[0m ";
        $readmeChoice = trim(fgets(STDIN));

        if ($readmeChoice === '1') {
            echo "\033[1;34mEnter new readme content:\033[0m ";
            $newReadme = trim(fgets(STDIN));
            if (!empty($newReadme)) {
                $updateData['readme_content'] = $newReadme;
                $updateData['readme_filename'] = null;
            }
        } elseif ($readmeChoice === '2') {
            $templateDir = $backendDir . '/template/Updates/Versions';
            if (is_dir($templateDir)) {
                $files = scandir($templateDir);
                $files = array_diff($files, ['.', '..', 'Files']);

                if (!empty($files)) {
                    echo "\n\033[1;34mAvailable template files:\033[0m\n";
                    $fileIndex = 1;
                    $fileMap = [];
                    foreach ($files as $file) {
                        echo "  \033[0;33m{$fileIndex}.\033[0m {$file}\n";
                        $fileMap[$fileIndex] = $file;
                        $fileIndex++;
                    }

                    echo "\n\033[1;34mSelect a file (number):\033[0m ";
                    $fileChoice = trim(fgets(STDIN));
                    if (isset($fileMap[$fileChoice])) {
                        $selectedFile = $templateDir . '/' . $fileMap[$fileChoice];
                        $readmeContent = file_get_contents($selectedFile);
                        if ($readmeContent !== false) {
                            $updateData['readme_content'] = $readmeContent;
                            $updateData['readme_filename'] = $fileMap[$fileChoice];
                            echo "\n\033[1;32mLoaded readme from: {$fileMap[$fileChoice]}\033[0m\n";
                        }
                    }
                }
            }
        }
    } elseif ($editChoice === '6') {
        echo "\n\033[1;34mReconfigure Assets from template/Updates/Files:\033[0m\n";
        echo "  \033[0;33m1.\033[0m Select assets from template directory\n";
        echo "  \033[0;33m2.\033[0m Set assets to null (no assets available)\n";
        echo "\n\033[1;34mChoice:\033[0m ";
        $assetsChoice = trim(fgets(STDIN));

        if ($assetsChoice === '2') {
            $updateData['assets'] = null;
        } else {
            $updateData['assets'] = promptForAssets($backendDir, $currentAssets);
        }
    } elseif ($editChoice === '7') {

        $currentUploadedFiles = [];
        if (!empty($selectedUpdate['assets_file'])) {
            $currentUploadedFiles = explode(',', $selectedUpdate['assets_file']);
            $currentUploadedFiles = array_filter(array_map('trim', $currentUploadedFiles));
        }

        echo "\n\033[1;34mCurrent Uploaded Files:\033[0m " . count($currentUploadedFiles) . " file(s)\n";
        foreach ($currentUploadedFiles as $cf) {
            echo "   - " . basename(parse_url($cf, PHP_URL_PATH)) . "\n";
        }

        echo "\n\033[1;34mManage uploaded files:\033[0m\n";
        echo "  \033[0;33m1.\033[0m Add files from template/Updates/Files\n";
        echo "  \033[0;33m2.\033[0m Remove specific file (by index)\n";
        echo "  \033[0;33m3.\033[0m Clear all files\n";
        echo "  \033[0;33m4.\033[0m Keep current files\n";
        echo "\n\033[1;34mChoice:\033[0m ";
        $manageChoice = trim(fgets(STDIN));

        if ($manageChoice === '1') {

            $newCloudinaryFiles = promptForCombinedAssets($backendDir);
            $updateData['pendingCloudinaryFiles'] = $newCloudinaryFiles['cloudinaryFiles'];
        } elseif ($manageChoice === '2') {

            echo "\033[0;37mEnter index of file to remove:\033[0m ";
            $indexToRemove = intval(trim(fgets(STDIN))) - 1;
            if ($indexToRemove >= 0 && $indexToRemove < count($currentUploadedFiles)) {
                $removed = array_splice($currentUploadedFiles, $indexToRemove, 1);
                echo "\033[1;32mRemoved file: " . basename(parse_url($removed[0], PHP_URL_PATH)) . "\033[0m\n";
                $updateData['assets_file'] = !empty($currentUploadedFiles) ? implode(',', $currentUploadedFiles) : null;
                if (isset($currentAssets[$indexToRemove])) {
                    array_splice($currentAssets, $indexToRemove, 1);
                    $updateData['assets'] = !empty($currentAssets) ? json_encode($currentAssets) : null;
                }
            } else {
                echo "\033[0;31mInvalid index. Keeping current files.\033[0m\n";
                $updateData['assets_file'] = $selectedUpdate['assets_file'] ?? null;
            }
        } elseif ($manageChoice === '3') {
            echo "\033[0;37mClearing all uploaded files.\033[0m\n";
            $updateData['assets_file'] = null;
            $currentAssets = array_filter($currentAssets, function($asset) {
                return !isset($asset['download_url']) || strpos($asset['download_url'], 'cloudinary') === false;
            });
            $updateData['assets'] = !empty($currentAssets) ? json_encode($currentAssets) : null;
        } else {
            echo "\033[0;37mKeeping current uploaded files.\033[0m\n";
            $updateData['assets_file'] = $selectedUpdate['assets_file'] ?? null;
        }
    } elseif ($editChoice === '8') {
        echo "\n\033[1;34mCurrent Closable Type:\033[0m {$selectedUpdate['closable_type']}\n";
        echo "\033[1;34mNew Closable Type:\033[0m\n";
        echo "  \033[0;33m1.\033[0m Closable (user can close modal)\n";
        echo "  \033[0;33m2.\033[0m Not closable (locks system, redirects to /updates)\n";
        echo "  \033[0;33m3.\033[0m Show once (show only once per user)\n";
        echo "\033[1;34mChoice:\033[0m ";
        $closableChoice = trim(fgets(STDIN));

        switch ($closableChoice) {
            case '1':
                $updateData['closable_type'] = "closable";
                break;
            case '2':
                $updateData['closable_type'] = "not_closable";
                break;
            case '3':
                $updateData['closable_type'] = "show_once";
                break;
        }
    } elseif ($editChoice === '9') {
        echo "\n\033[1;34mCurrent Active Status:\033[0m " . ($selectedUpdate['is_active'] ? 'Active' : 'Inactive') . "\n";
        echo "\033[1;34mToggle active status?\033[0m (y/n): ";
        $changeActive = trim(fgets(STDIN));
        if (strtolower($changeActive) === 'y') {
            $updateData['is_active'] = $selectedUpdate['is_active'] ? 0 : 1;
        }
    } elseif ($editChoice === '10') {
        echo "\033[1;34mEnter new version (current: {$selectedUpdate['version']}):\033[0m ";
        $newVersion = trim(fgets(STDIN));
        if (!empty($newVersion)) $updateData['version'] = $newVersion;

        echo "\033[1;34mEnter new title (current: {$selectedUpdate['name']}):\033[0m ";
        $newName = trim(fgets(STDIN));
        if (!empty($newName)) $updateData['name'] = $newName;

        $curBranch = !empty($selectedUpdate['branch']) ? $selectedUpdate['branch'] : 'main';
        echo "\033[1;34mEnter new branch (current: {$curBranch}):\033[0m ";
        $newBranch = trim(fgets(STDIN));
        if (!empty($newBranch)) $updateData['branch'] = $newBranch;

        $curGithubLink = $selectedUpdate['github_branch_link'] ?? 'None';
        echo "\033[1;34mEnter new GitHub branch link (current: {$curGithubLink}):\033[0m ";
        $newGithubLink = trim(fgets(STDIN));
        if (!empty($newGithubLink)) {
            $updateData['github_branch_link'] = $newGithubLink;
        } else {
            $updateData['github_branch_link'] = null;
        }

        echo "\033[1;34mEdit readme content?\033[0m (y/n): ";
        if (strtolower(trim(fgets(STDIN))) === 'y') {
            echo "  \033[0;33m1.\033[0m Enter manually\n";
            echo "  \033[0;33m2.\033[0m Choose from template directory\n";
            $readmeChoice = trim(fgets(STDIN));
            if ($readmeChoice === '1') {
                echo "\033[1;34mEnter new readme content:\033[0m ";
                $newReadme = trim(fgets(STDIN));
                if (!empty($newReadme)) {
                    $updateData['readme_content'] = $newReadme;
                    $updateData['readme_filename'] = null;
                }
            } elseif ($readmeChoice === '2') {
                $templateDir = $backendDir . '/template/Updates/Versions';
                $files = scandir($templateDir);
                $files = array_diff($files, ['.', '..', 'Files']);
                $fIndex = 1;
                $fMap = [];
                foreach ($files as $file) {
                    echo "  \033[0;33m{$fIndex}.\033[0m {$file}\n";
                    $fMap[$fIndex] = $file;
                    $fIndex++;
                }
                echo "Select file: ";
                $fc = trim(fgets(STDIN));
                if (isset($fMap[$fc])) {
                    $updateData['readme_content'] = file_get_contents($templateDir . '/' . $fMap[$fc]);
                    $updateData['readme_filename'] = $fMap[$fc];
                }
            }
        }

        echo "\033[1;34mReconfigure assets from template/Updates/Files?\033[0m (y/n): ";
        if (strtolower(trim(fgets(STDIN))) === 'y') {
            echo "  \033[0;33m1.\033[0m Select assets from template directory\n";
            echo "  \033[0;33m2.\033[0m Set assets to null (no assets available)\n";
            echo "\n\033[1;34mChoice:\033[0m ";
            $assetsChoice = trim(fgets(STDIN));

            if ($assetsChoice === '2') {
                $updateData['assets'] = null;
            } else {
                $updateData['assets'] = promptForAssets($backendDir, $currentAssets);
            }
        }

        $currentUploadedFiles = [];
        if (!empty($selectedUpdate['assets_file'])) {
            $currentUploadedFiles = explode(',', $selectedUpdate['assets_file']);
            $currentUploadedFiles = array_filter(array_map('trim', $currentUploadedFiles));
        }

        echo "\033[1;34mCurrent Uploaded Files:\033[0m " . count($currentUploadedFiles) . " file(s)\n";
        foreach ($currentUploadedFiles as $cf) {
            echo "   - " . basename(parse_url($cf, PHP_URL_PATH)) . "\n";
        }

        echo "\033[1;34mUpload new asset files?\033[0m (y/n): ";
        if (strtolower(trim(fgets(STDIN))) === 'y') {
            $newCloudinaryFiles = promptForCombinedAssets($backendDir);
            $updateData['pendingCloudinaryFiles'] = $newCloudinaryFiles['cloudinaryFiles'];
        }

        echo "\033[1;34mSelect new Closable Type:\033[0m (1: Closable, 2: Not Closable, 3: Show Once, Enter to keep): ";
        $cChoice = trim(fgets(STDIN));
        if ($cChoice === '1') $updateData['closable_type'] = "closable";
        elseif ($cChoice === '2') $updateData['closable_type'] = "not_closable";
        elseif ($cChoice === '3') $updateData['closable_type'] = "show_once";
    }

    $updateData['is_updated'] = 1;

    echo "\n\033[1;36m=== Review Changes ===\033[0m\n";
    echo "\033[1;34mVersion:\033[0m         v{$updateData['version']}\n";
    echo "\033[1;34mTitle:\033[0m           {$updateData['name']}\n";
    echo "\033[1;34mBranch:\033[0m          {$updateData['branch']}\n";
    echo "\033[1;34mGitHub Link:\033[0m      " . ($updateData['github_branch_link'] ?? 'None') . "\n";
    echo "\033[1;34mAssets Count:\033[0m    " . (is_array($updateData['assets']) ? count($updateData['assets']) : 0) . " file(s)\n";

    $pendingCloudinaryFiles = isset($updateData['pendingCloudinaryFiles']) ? $updateData['pendingCloudinaryFiles'] : [];
    echo "\033[1;34mCloudinary Upload:\033[0m " . (count($pendingCloudinaryFiles) > 0 ? count($pendingCloudinaryFiles) . " file(s) to upload" : "None") . "\n";
    foreach ($pendingCloudinaryFiles as $cf) {
        echo "   - {$cf}\n";
    }
    
    echo "\033[1;34mClosable Type:\033[0m   {$updateData['closable_type']}\n";
    echo "\033[1;34mActive Status:\033[0m   " . ($updateData['is_active'] ? 'Active' : 'Inactive') . "\n";
    echo "\033[1;34mMarked as Edited:\033[0m Yes (is_updated = 1)\n";
    echo "\n";
    echo "\033[1;34mSave changes? (y/n):\033[0m ";
    $confirm = trim(fgets(STDIN));

    if (strtolower($confirm) !== 'y') {
        showWarning("Update edit cancelled.");
        return;
    }

    $uploadedFiles = [];
    if (!empty($pendingCloudinaryFiles)) {
        require_once __DIR__ . '/../config/cloudinary.php';
        $filesDir = $backendDir . '/template/Updates/Files';

        echo "\n\033[1;34mUploading files to Cloudinary...\033[0m\n";
        $totalFiles = count($pendingCloudinaryFiles);
        $currentFile = 0;

        foreach ($pendingCloudinaryFiles as $fileName) {
            $currentFile++;
            $assetFilePath = $filesDir . '/' . $fileName;
            if (file_exists($assetFilePath)) {
                $fileSize = filesize($assetFilePath);
                echo "\033[1;33m[{$currentFile}/{$totalFiles}] Uploading: {$fileName} (" . formatBytes($fileSize) . ")\033[0m\n";

                showLoadingBar("Uploading", 5);

                try {
                    $assetFileUrl = CloudinaryConfig::uploadFile($assetFilePath, 'updates');
                    $uploadedFiles[] = $assetFileUrl;
                    
                    echo "\033[1;32m✓ Upload successful\033[0m\n";
                } catch (Exception $e) {
                    echo "\033[0;31m✗ Upload failed: " . $e->getMessage() . "\033[0m\n";
                    echo "\033[0;37mSkipping this file.\033[0m\n";
                }
            }
        }
    }

    if (!empty($uploadedFiles)) {
        $currentUploadedFiles = array_merge($currentUploadedFiles, $uploadedFiles);
        $updateData['assets_file'] = !empty($currentUploadedFiles) ? implode(',', $currentUploadedFiles) : null;
    }

    unset($updateData['pendingCloudinaryFiles']);

    $result = $updatesModel->update($selectedUpdate['id'], $updateData);

    if ($result) {
        showSuccess("Update #{$selectedUpdate['id']} updated successfully!");
        echo "\n\033[1;32mChanges are saved and an 'Updated' label will be displayed on the frontend.\033[0m\n";
    } else {
        showError("Failed to update update.");
    }
}

function deleteUpdatePrompt($backendDir) {
    require_once __DIR__ . '/../../model/web/UpdatesModel.php';
    $updatesModel = new UpdatesModel();

    echo "\n\033[1;31m=== Delete Update ===\033[0m\n\n";
    $updates = $updatesModel->readAll();

    if (!$updates || empty($updates)) {
        showWarning("No updates found to delete.");
        return;
    }

    $index = 1;
    $map = [];
    foreach ($updates as $u) {
        echo "  \033[0;33m{$index}.\033[0m ID: {$u['id']} | v{$u['version']} | {$u['name']}\n";
        $map[$index] = $u;
        $index++;
    }

    echo "\n\033[1;34mSelect update to delete (number):\033[0m ";
    $choice = trim(fgets(STDIN));

    if (!isset($map[$choice])) {
        showError("Invalid choice.");
        return;
    }

    $target = $map[$choice];
    echo "\033[1;31mAre you sure you want to permanently delete Update ID: {$target['id']} (v{$target['version']})? (y/n):\033[0m ";
    if (strtolower(trim(fgets(STDIN))) !== 'y') {
        showWarning("Deletion cancelled.");
        return;
    }

    if ($updatesModel->delete($target['id'])) {
        showSuccess("Update deleted successfully.");
    } else {
        showError("Failed to delete update.");
    }
}
