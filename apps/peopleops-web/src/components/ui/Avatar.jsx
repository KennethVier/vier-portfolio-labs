import { initials } from '../../utils/formatters.js';

const Avatar = ({ name }) => <span className="avatar">{initials(name)}</span>;

export default Avatar;