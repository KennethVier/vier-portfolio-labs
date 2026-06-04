const CatalogControls = ({ query, section, category, sortBy, onQueryChange, onSectionChange, onCategoryChange, onSortChange }) => {
  return (
    <section className="catalog-controls" aria-label="Catalog controls">
      <label className="search-box">
        <i className="bi bi-search" />
        <input
          type="search"
          placeholder="Search product name"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <select value={section} onChange={(event) => onSectionChange(event.target.value)} aria-label="Filter section">
        <option value="all">All sections</option>
        <option value="women">Women</option>
        <option value="men">Men</option>
      </select>
      <select value={category} onChange={(event) => onCategoryChange(event.target.value)} aria-label="Filter category">
        <option value="all">All categories</option>
        <option value="tops">Tops</option>
        <option value="bottoms">Bottoms</option>
        <option value="dress">Dress</option>
        <option value="footwear">Footwear</option>
        <option value="accessories">Accessories</option>
        <option value="others">Others</option>
      </select>
      <select value={sortBy} onChange={(event) => onSortChange(event.target.value)} aria-label="Sort products">
        <option value="featured">Featured</option>
        <option value="name-asc">Name A-Z</option>
        <option value="price-asc">Price low-high</option>
        <option value="price-desc">Price high-low</option>
        <option value="stock-desc">Most stock</option>
      </select>
    </section>
  );
};

export default CatalogControls;