const StateBlock = ({ status, errorMessage, empty, emptyMessage = 'No records found.', children }) => {
  if (status === 'loading') {
    return <section className="state-block"><span className="loader" /><h2>Loading workspace...</h2><p>Fetching live PeopleOps data.</p></section>;
  }
  if (status === 'error') {
    return <section className="state-block error"><h2>PeopleOps service unavailable</h2><p>{errorMessage}</p></section>;
  }
  if (status === 'demo') {
    return <><section className="demo-fallback-notice"><strong>Demo data mode</strong><span>Live backend is currently disabled for this portfolio demo. Contact the admin to enable this workflow.</span></section>{children}</>;
  }
  if (empty) {
    return <section className="state-block"><h2>No data yet</h2><p>{emptyMessage}</p></section>;
  }
  return children;
};

export default StateBlock;
