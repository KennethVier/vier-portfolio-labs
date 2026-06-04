package com.portfolio.shop.mapper;

import com.portfolio.shop.dto.ProductDto;
import com.portfolio.shop.model.Product;

public final class ProductMapper {

    private ProductMapper() {
    }

    public static ProductDto toDto(Product product) {
        return ProductDto.builder()
                .id(product.getId())
                .productName(product.getProductName())
                .productPrice(product.getProductPrice())
                .category(product.getCategory())
                .section(product.getSection())
                .stocks(product.getStocks())
                .imageUrl(product.getImageUrl())
                .build();
    }

    public static Product toEntity(ProductDto productDto) {
        return Product.builder()
                .id(productDto.getId())
                .productName(productDto.getProductName())
                .productPrice(productDto.getProductPrice())
                .category(productDto.getCategory())
                .section(productDto.getSection())
                .stocks(productDto.getStocks())
                .imageUrl(productDto.getImageUrl())
                .build();
    }

    public static void updateEntity(Product product, ProductDto productDto) {
        product.setProductName(productDto.getProductName());
        product.setProductPrice(productDto.getProductPrice());
        product.setCategory(productDto.getCategory());
        product.setSection(productDto.getSection());
        product.setStocks(productDto.getStocks());
        product.setImageUrl(productDto.getImageUrl());
    }
}