import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function DeleteAccount() {
    const deleteAccount = useAuthStore((s) => s.deleteAccount);
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This action is irreversible.")) {
            return;
        }

        setIsDeleting(true);
        await deleteAccount();
        navigate("/login");
    };

    return (
        <div className="bg-card p-6 rounded-lg">
            <p className="text-white/70 text-sm mb-6">
                You can delete your account by clicking the button below. This will remove all user data currently associated with your profile.
            </p>
            <p className="text-white/80 text-sm font-semibold mb-8">
                This action is <span className="text-red-400">irreversible</span>, and you will need to re-register if you wish to access the client area again.
            </p>

            <div className="flex justify-start">
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50"
                >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
            </div>
        </div>
    );
}