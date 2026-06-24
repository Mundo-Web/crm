import { useEffect, useState } from "react";
import Global from "../Utils/Global";

const LeadAvatar = ({ lead, className = "avatar-sm", style = {}, ...props }) => {
    const [imgError, setImgError] = useState(false);

    // Reset error state if the contact phone or integration user id changes
    useEffect(() => {
        setImgError(false);
    }, [lead?.integration_user_id, lead?.contact_phone]);

    if (!lead) return null;

    if (imgError) {
        const name = lead.contact_name || lead.name || '';
        const initials = name
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        const colors = ['primary', 'success', 'danger', 'warning', 'info', 'purple', 'pink'];
        // Generate a consistent color based on name length or phone number
        const val = (lead.contact_phone || name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const color = colors[val % colors.length];

        return (
            <div 
                className={`rounded-circle d-flex align-items-center justify-content-center bg-soft-${color} text-${color} fw-bold ${className}`}
                style={{ aspectRatio: '1/1', objectFit: 'cover', ...style }}
                {...props}
            >
                {initials || <i className="mdi mdi-account" />}
            </div>
        );
    }

    return (
        <img 
            src={`/api/whatsapp/profile/${lead.contact_phone || lead.integration_user_id}`}
            className={`rounded-circle bg-light ${className}`}
            alt={lead.name} 
            style={{ padding: 0, border: 'none', objectFit: 'cover', ...style }}
            onError={() => setImgError(true)} 
            {...props}
        />
    );
};

export default LeadAvatar;
