import React from 'react';

interface SelectOptionsProps {
    users: { username: string }[];
}

const SelectOptions: React.FC<SelectOptionsProps> = ({ users }) => (
    <select id="selectUser" className="selectOptions">
        <option value="">Select user</option>
        {users.map(user => (
            <option key={user.username} value={user.username}>
                {user.username}
            </option>
        ))}
    </select>
);

export default SelectOptions;
