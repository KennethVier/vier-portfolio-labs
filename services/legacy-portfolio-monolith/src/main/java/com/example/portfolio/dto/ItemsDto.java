package com.example.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemsDto {

    private Long id;

    private String productName;

    private Integer productPrice;

    private String category;

    private String section;

    private Integer stocks;

    private String imageUrl;

}
