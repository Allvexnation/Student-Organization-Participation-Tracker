<?php

require_once __DIR__ . '/../../model/Adviser/AdviserOrganizationModel.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../cache/CacheService.php';

class AdviserOrganizationController {
    private $adviserOrganizationModel;

    public function __construct() {
        $this->adviserOrganizationModel = new AdviserOrganizationModel();
    }

    private function getBearerToken() {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        if (!empty($headers)) {
            foreach ($headers as $key => $value) {
                if (strtolower($key) === 'authorization') {
                    $token = trim(str_ireplace('Bearer ', '', $value));
                    if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                        return $token;
                    }
                }
            }
        }
        
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = trim(str_ireplace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']));
            if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                return $token;
            }
        }
        
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $token = trim(str_ireplace('Bearer ', '', $_SERVER['REDIRECT_HTTP_AUTHORIZATION']));
            if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                return $token;
            }
        }
        
        return null;
    }

    private function getAdviserIdFromToken() {
        $token = $this->getBearerToken();
        
        if (!$token || !JWT::validate($token)) {
            return null;
        }

        $payload = JWT::decode($token);
        return isset($payload['user_id']) ? $payload['user_id'] : null;
    }

    private function resolveOwnedOrganizationId($adviser_id, $requested_id, $fallback_id = null) {
        $organizations = $this->adviserOrganizationModel->getAllOrganizationsByAdviserId($adviser_id);
        if (!$organizations) {
            return $fallback_id;
        }

        $ownedIds = [];
        foreach ($organizations as $org) {
            $ownedIds[(string)$org['id']] = $org['id'];
        }

        if ($requested_id !== null && $requested_id !== '' && isset($ownedIds[(string)$requested_id])) {
            return $ownedIds[(string)$requested_id];
        }

        if ($fallback_id !== null && $fallback_id !== '' && isset($ownedIds[(string)$fallback_id])) {
            return $ownedIds[(string)$fallback_id];
        }

        return null;
    }

    public function getOrganization() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $organization = $this->adviserOrganizationModel->getCurrentOrganizationForAdviser($adviser_id);

        if ($organization) {
            http_response_code(200);
            echo json_encode(['organization' => $organization]);
        } else {
            http_response_code(200);
            echo json_encode(['organization' => null, 'message' => 'Organization not found']);
        }
    }

    public function getAllOrganizations() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $organizations = $this->adviserOrganizationModel->getAllOrganizationsByAdviserId($adviser_id);

        if ($organizations !== false) {
            http_response_code(200);
            echo json_encode(['organizations' => $organizations]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch organizations']);
        }
    }

    public function setCurrentOrganization() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['organization_id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing organization_id']);
            return;
        }

        $result = $this->adviserOrganizationModel->setCurrentOrganizationForAdviser($adviser_id, $data['organization_id']);

        if ($result) {
            $organization = $this->adviserOrganizationModel->getCurrentOrganizationForAdviser($adviser_id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Current organization updated successfully',
                'organization' => $organization
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update current organization']);
        }
    }

    public function updateOrganization() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        if (!isset($data['org_code']) || !isset($data['name']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->adviserOrganizationModel->updateOrganization($adviser_id, $data);
        if ($result) {
            CacheService::forget('organizations_all');
        }

        if ($result) {
            $organization = $this->adviserOrganizationModel->getCurrentOrganizationForAdviser($adviser_id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Organization updated successfully',
                'organization' => $organization
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update organization']);
        }
    }

    public function getMemberships() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $organization = $this->adviserOrganizationModel->getCurrentOrganizationForAdviser($adviser_id);
        
        if (!$organization) {
            http_response_code(200);
            echo json_encode(['organization_memberships' => []]);
            return;
        }

        $memberships = $this->adviserOrganizationModel->getMembershipsByOrganizationId($organization['id']);

        if ($memberships !== false) {
            http_response_code(200);
            $json = json_encode(['organization_memberships' => $memberships], JSON_INVALID_UTF8_SUBSTITUTE);
            echo ($json !== false) ? $json : json_encode(['organization_memberships' => []]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch organization memberships']);
        }
    }

    public function getMembership($id) {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $organization = $this->adviserOrganizationModel->getCurrentOrganizationForAdviser($adviser_id);
        
        if (!$organization) {
            http_response_code(404);
            echo json_encode(['message' => 'Organization not found']);
            return;
        }

        $memberships = $this->adviserOrganizationModel->getMembershipsByOrganizationId($organization['id']);
        
        if ($memberships === false) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch organization memberships']);
            return;
        }

        $membership = null;
        foreach ($memberships as $m) {
            if ($m['id'] == $id) {
                $membership = $m;
                break;
            }
        }

        if ($membership) {
            http_response_code(200);
            echo json_encode(['organization_membership' => $membership]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Membership not found']);
        }
    }

    public function createMembership() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $organization = $this->adviserOrganizationModel->getCurrentOrganizationForAdviser($adviser_id);
        
        if (!$organization) {
            http_response_code(404);
            echo json_encode(['message' => 'Organization not found']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        if (!isset($data['student_id']) || !isset($data['date_joined']) || !isset($data['role_id']) || !isset($data['membership_status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $data['organization_id'] = $this->resolveOwnedOrganizationId($adviser_id, $data['organization_id'] ?? null, $organization['id']);
        if (!$data['organization_id']) {
            http_response_code(403);
            echo json_encode(['message' => 'You do not have access to this organization']);
            return;
        }
        $result = $this->adviserOrganizationModel->createMembership($data);
        if ($result) {
            CacheService::forget('org_memberships_all');
        }

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Organization membership created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create organization membership']);
        }
    }

    public function updateMembership($id) {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $organization = $this->adviserOrganizationModel->getCurrentOrganizationForAdviser($adviser_id);
        
        if (!$organization) {
            http_response_code(404);
            echo json_encode(['message' => 'Organization not found']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        if (!isset($data['student_id']) || !isset($data['date_joined']) || !isset($data['role_id']) || !isset($data['membership_status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $data['organization_id'] = $this->resolveOwnedOrganizationId($adviser_id, $data['organization_id'] ?? null, $organization['id']);
        if (!$data['organization_id']) {
            http_response_code(403);
            echo json_encode(['message' => 'You do not have access to this organization']);
            return;
        }
        $result = $this->adviserOrganizationModel->updateMembership($id, $data);
        if ($result) {
            CacheService::forget('org_memberships_all');
            CacheService::forget('org_membership_' . $id);
        }

        if ($result) {
            $membership = $this->adviserOrganizationModel->getMembershipsByOrganizationId($organization['id']);
            $updatedMembership = null;
            foreach ($membership as $m) {
                if ($m['id'] == $id) {
                    $updatedMembership = $m;
                    break;
                }
            }
            http_response_code(200);
            echo json_encode([
                'message' => 'Organization membership updated successfully',
                'organization_membership' => $updatedMembership
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update organization membership']);
        }
    }

    public function deleteMembership($id) {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $organization = $this->adviserOrganizationModel->getCurrentOrganizationForAdviser($adviser_id);
        
        if (!$organization) {
            http_response_code(404);
            echo json_encode(['message' => 'Organization not found']);
            return;
        }

        $result = $this->adviserOrganizationModel->deleteMembership($id);
        if ($result) {
            CacheService::forget('org_memberships_all');
            CacheService::forget('org_membership_' . $id);
        }

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Organization membership deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete organization membership']);
        }
    }

    public function getMembershipsByOrganizationId($organization_id) {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $ownedId = $this->resolveOwnedOrganizationId($adviser_id, $organization_id, null);
        if (!$ownedId) {
            http_response_code(403);
            echo json_encode(['message' => 'You do not have access to this organization']);
            return;
        }

        $memberships = $this->adviserOrganizationModel->getMembershipsByOrganizationId($ownedId);

        if ($memberships !== false) {
            http_response_code(200);
            $json = json_encode(['organization_memberships' => $memberships], JSON_INVALID_UTF8_SUBSTITUTE);
            echo ($json !== false) ? $json : json_encode(['organization_memberships' => []]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch organization memberships']);
        }
    }
}
