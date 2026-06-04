const StateBlock = ({ status, errorMessage, empty, emptyMessage = 'No records found.', children }) => {
  if (status === 'loading') {
    return <section className="state-block"><span className="loader" /><h2>Loading workspace...</h2><p>Fetching live PeopleOps data.</p></section>;
  }
  if (status === 'error') {
    return <section className="state-block error"><h2>PeopleOps service unavailable</h2><p>{errorMessage}</p></section>;
  }
  if (empty) {
    return <section className="state-block"><h2>No data yet</h2><p>{emptyMessage}</p></section>;
  }
  return children;
};

export default StateBlock;