import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import * as StudentsAPI from '../../../api/admin/Students/ManageStudents.js';
import { initManageStudentsAnimations, animateTableRows } from '../../../provider/Animation/ManageStudentsAnimation.js';
import { openManageStudentsModal, openViewStudentsModal } from '../../../components/Modal/ManageStudentsModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function ManageStudents() {
    return `
        ${AdminNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Manage Students</h1>
                    <p class="text-sm text-gray-500 mt-1">Manage student accounts and their information in the system.</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <input 
                        type="text" 
                        id="studentSearch" 
                        placeholder="Search students..." 
                        class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                    <button 
                        type="button" 
                        id="addStudentBtn" 
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center gap-2 shadow-sm">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add New</span>
                    </button>
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th class="px-5 py-3.5">Photo</th>
                                <th class="px-5 py-3.5">Name</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Student No.</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Program</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Year Level</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Email</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Created At</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="studentTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 8, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageStudents() {
    protectAdminRoute();
    await initAdminNavbar();

    initManageStudentsAnimations();

    let students = [];
    let hasLoaded = false;

    async function loadStudents(forceRefresh = false) {
        const cachedData = localStorage.getItem('cachedStudents');
        if (cachedData && !forceRefresh) {
            try {
                students = JSON.parse(cachedData);
                renderStudents(students);
                hasLoaded = true;
                return;
            } catch (e) {
                console.error('Error parsing cached students:', e);
            }
        }

        try {
            students = await StudentsAPI.getAllStudents();
            localStorage.setItem('cachedStudents', JSON.stringify(students));
            localStorage.setItem('cachedStudentsTimestamp', Date.now().toString());
            renderStudents(students);
            hasLoaded = true;
        } catch (error) {
            console.error('Error loading students:', error);
            const tbody = document.getElementById('studentTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="px-5 py-12 text-center text-red-500">Failed to load students</td>
                    </tr>
                `;
            }
            showToast('Failed to load students', 'error');
        }
    }

    function renderStudents(data) {
        const tbody = document.getElementById('studentTableBody');
        
        if (!tbody) {
            console.error('studentTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-5 py-12 text-center">
                        <i data-lucide="user" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No students found.</p>
                        <p class="text-xs text-gray-400 mt-1">Click "Add New" to create the first student.</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = data.map((student, index) => {
            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    ${student.profile_photo ? 
                        `<img src="${student.profile_photo}" alt="${student.first_name} ${student.last_name}" class="w-10 h-10 object-cover rounded-full">` : 
                        `<div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <i data-lucide="user" class="w-5 h-5 text-gray-400"></i>
                        </div>`
                    }
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <p class="text-xs sm:text-sm font-semibold text-gray-900">${student.first_name} ${student.last_name}</p>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${student.student_number}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${student.program}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        ${student.year_level}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${student.email}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm whitespace-nowrap">
                    ${student.created_at ? new Date(student.created_at).toLocaleDateString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    ${CrudMenu({ 
                        id: String(student.id), 
                        showView: true,
                        onView: 'viewStudent',
                        onEdit: 'editStudent', 
                        onDelete: 'deleteStudent',
                        deleteLabel: `${student.first_name} ${student.last_name}`
                    })}
                </td>
            </tr>
            `;
        }).join('');

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
                    const response = await StudentsAPI.createStudent(data);
                    localStorage.removeItem('cachedStudents');
                    localStorage.removeItem('cachedStudentsTimestamp');
                    loadStudents(true);
                    return response;
                }
                localStorage.removeItem('cachedStudents');
                localStorage.removeItem('cachedStudentsTimestamp');
                loadStudents(true);
            }
        });
    });

    window.editStudent = (id) => {
        openManageStudentsModal({
            mode: 'edit',
            studentId: id,
            onSubmit: async (id, data) => {
                await StudentsAPI.updateStudent(id, data);
                localStorage.removeItem('cachedStudents');
                localStorage.removeItem('cachedStudentsTimestamp');
                loadStudents(true);
            }
        });
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
            showReason: true,
            onConfirm: async (reason) => {
                try {
                    await StudentsAPI.deleteStudent(id, reason);
                    loadStudents(true);
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

    const waitForElement = () => {
        if (document.getElementById('studentTableBody')) {
            loadStudents(true);
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}
