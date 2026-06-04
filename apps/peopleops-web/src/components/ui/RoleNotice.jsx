const RoleNotice = ({ title, message, tone = 'info' }) => (
  <div className={`role-notice ${tone}`}>
    <strong>{title}</strong>
    <span>{message}</span>
  </div>
);

export default RoleNotice;
