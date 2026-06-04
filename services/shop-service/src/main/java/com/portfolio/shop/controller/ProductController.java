package com.portfolio.shop.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.portfolio.shop.dto.ProductDto;
import com.portfolio.shop.service.ProductService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/items")
@AllArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getProducts(
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(productService.getProducts(section, category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @GetMapping("/section")
    public ResponseEntity<List<ProductDto>> getProductsBySection(@RequestParam String section) {
        return ResponseEntity.ok(productService.getProducts(section, null));
    }

    @GetMapping("/category")
    public ResponseEntity<List<ProductDto>> getProductsByCategory(
            @RequestParam String category,
            @RequestParam(required = false) String section) {
        return ResponseEntity.ok(productService.getProducts(section, category));
    }

    @GetMapping("/categorysection")
    public ResponseEntity<List<ProductDto>> getProductsByCategoryAndSection(
            @RequestParam String category,
            @RequestParam String section) {
        return ResponseEntity.ok(productService.getProducts(section, category));
    }

    @PostMapping
    public ResponseEntity<ProductDto> addProduct(@Valid @RequestBody ProductDto productDto) {
        ProductDto createdProduct = productService.addProduct(productDto);
        return ResponseEntity.created(URI.create("/api/items/" + createdProduct.getId())).body(createdProduct);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductDto productDto) {
        return ResponseEntity.ok(productService.updateProduct(id, productDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}