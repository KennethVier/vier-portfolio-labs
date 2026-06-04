import { prettyEnum } from '../../utils/formatters.js';

const StatusPill = ({ status }) => <span className={`status-pill ${String(status).toLowerCase()}`}>{prettyEnum(status)}</span>;

export default StatusPill;