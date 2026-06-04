package com.portfolio.shop.service;

import java.util.List;

import com.portfolio.shop.dto.ProductDto;

public interface ProductService {

    List<ProductDto> getProducts(String section, String category);

    ProductDto getProduct(Long id);

    ProductDto addProduct(ProductDto productDto);

    ProductDto updateProduct(Long id, ProductDto productDto);

    void deleteProduct(Long id);
}