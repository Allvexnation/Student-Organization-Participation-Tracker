import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { requireAuth } from '../../../utils/jwt.js';
import * as StudentsAPI from '../../../api/admin/Students/ManageStudents.js';
import { initManageStudentsAnimations, addButtonHoverAnimations, animateSearchInput, animateTableRows } from '../../../provider/Animation/ManageStudentsAnimation.js';
import { openManageStudentsModal, openViewStudentsModal } from '../../../components/Modal/ManageStudentsModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';

export function ManageStudents() {
    return `
        ${AdminNavbar()}
        <main class="container mx-auto px-4 py-8 bg-white min-h-screen">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-blue-800">Manage Students</h2>
                    <button id="addStudentBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add Student</span>
                    </button>
                </div>

                <div class="mb-4">
                    <input type="text" id="studentSearch" placeholder="Search students..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full table-fixed border-collapse">
                        <thead>
                            <tr class="bg-blue-50">
                                <th class="w-20 px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Photo</th>
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Name</th>
                                <th class="hidden sm:table-cell w-28 px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Student No.</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Program</th>
                                <th class="hidden sm:table-cell w-28 px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Year Level</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Email</th>
                                <th class="hidden sm:table-cell w-28 px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Created At</th>
                                <th class="w-28 px-3 py-2.5 text-center text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="studentTableBody">
                            ${Array.from({ length: 5 }, () => `
                                <tr>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="flex justify-center">
                                            <div class="inline-flex items-center gap-0.5 bg-gray-50/80 p-0.5 rounded-lg border border-gray-200/70">
                                                <div class="w-7 h-7 bg-gray-200 rounded-md animate-pulse"></div>
                                                <div class="w-7 h-7 bg-gray-200 rounded-md animate-pulse"></div>
                                                <div class="w-7 h-7 bg-gray-200 rounded-md animate-pulse"></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageStudents() {
    requireAuth();
    await initAdminNavbar();

    initManageStudentsAnimations();
    addButtonHoverAnimations('button');
    animateSearchInput('#studentSearch');

    let students = [];

    async function loadStudents() {
        try {
            students = await StudentsAPI.getAllStudents();
            renderStudents(students);
        } catch (error) {
            console.error('Error loading students:', error);
            const tbody = document.getElementById('studentTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="px-4 py-8 text-center text-red-500">Failed to load students</td>
                    </tr>
                `;
            }
            showToast('Failed to load students', 'error');
        }
    }

    function renderStudents(data) {
        const tbody = document.getElementById('studentTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-4 py-8 text-center text-gray-500">No students found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(student => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-3 py-2.5 border-b">
                    ${student.profile_photo ? 
                        `<img src="${student.profile_photo}" alt="${student.first_name} ${student.last_name}" class="w-12 h-12 object-cover rounded-full">` : 
                        `<div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <i data-lucide="user" class="w-6 h-6 text-gray-400"></i>
                        </div>`
                    }
                </td>
                <td class="px-3 py-2.5 border-b text-gray-900 truncate">${student.first_name} ${student.last_name}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 truncate">${student.student_number}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 truncate">${student.program}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        ${student.year_level}
                    </span>
                </td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 truncate">${student.email}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 text-sm whitespace-nowrap">${new Date(student.created_at).toLocaleDateString()}</td>
                <td class="px-3 py-2.5 border-b text-center align-middle" onclick="event.stopPropagation()">
                    <div class="flex justify-center">
                        ${CrudMenu({
                            id: String(student.id),
                            showView: true,
                            onView: 'viewStudent',
                            onEdit: 'editStudent',
                            onDelete: 'deleteStudent',
                            deleteLabel: `${student.first_name} ${student.last_name}`
                        })}
                    </div>
                </td>
            </tr>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        animateTableRows('#studentTableBody tr');
    }

    document.getElementById('addStudentBtn').addEventListener('click', () => {
        openManageStudentsModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    await StudentsAPI.updateStudent(id, data);
                } else {
                    await StudentsAPI.createStudent(data);
                }
                loadStudents();
            }
        });
    });

    window.editStudent = async (id) => {
        try {
            const student = await StudentsAPI.getStudent(id);
            openManageStudentsModal({
                mode: 'edit',
                student: student,
                onSubmit: async (id, data) => {
                    await StudentsAPI.updateStudent(id, data);
                    loadStudents();
                }
            });
        } catch (error) {
            console.error('Error loading student:', error);
            showToast('Failed to load student', 'error');
        }
    };

    window.viewStudent = async (id) => {
        await openViewStudentsModal(id);
    };

    window.deleteStudent = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this student'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await StudentsAPI.deleteStudent(id);
                    loadStudents();
                    showToast('Student deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting student:', error);
                    showToast('Failed to delete student', 'error');
                }
            }
        });
    };

    document.getElementById('studentSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = students.filter(student => 
            `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm) ||
            student.student_number.toLowerCase().includes(searchTerm) ||
            student.email.toLowerCase().includes(searchTerm) ||
            student.program.toLowerCase().includes(searchTerm)
        );
        renderStudents(filtered);
    });

    loadStudents();
}
