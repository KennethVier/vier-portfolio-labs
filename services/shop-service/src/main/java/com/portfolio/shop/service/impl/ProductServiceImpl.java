package com.portfolio.shop.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.portfolio.shop.dto.ProductDto;
import com.portfolio.shop.exception.ResourceNotFoundException;
import com.portfolio.shop.mapper.ProductMapper;
import com.portfolio.shop.model.Product;
import com.portfolio.shop.repository.ProductRepository;
import com.portfolio.shop.service.ProductService;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public List<ProductDto> getProducts(String section, String category) {
        List<Product> products;

        if (hasValue(section) && hasValue(category)) {
            products = productRepository.findByCategoryIgnoreCaseAndSectionIgnoreCase(category, section);
        } else if (hasValue(section)) {
            products = productRepository.findBySectionIgnoreCase(section);
        } else if (hasValue(category)) {
            products = productRepository.findByCategoryIgnoreCase(category);
        } else {
            products = productRepository.findAll();
        }

        return products.stream().map(ProductMapper::toDto).toList();
    }

    @Override
    public ProductDto getProduct(Long id) {
        return ProductMapper.toDto(findProduct(id));
    }

    @Override
    public ProductDto addProduct(ProductDto productDto) {
        Product product = ProductMapper.toEntity(productDto);
        product.setId(null);
        return ProductMapper.toDto(productRepository.save(product));
    }

    @Override
    public ProductDto updateProduct(Long id, ProductDto productDto) {
        Product product = findProduct(id);
        ProductMapper.updateEntity(product, productDto);
        return ProductMapper.toDto(productRepository.save(product));
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = findProduct(id);
        productRepository.delete(product);
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    private boolean hasValue(String value) {
        return value != null && !value.isBlank();
    }
}