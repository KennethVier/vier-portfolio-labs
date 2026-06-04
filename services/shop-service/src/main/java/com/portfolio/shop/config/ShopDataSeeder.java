package com.portfolio.shop.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.portfolio.shop.model.Product;
import com.portfolio.shop.repository.ProductRepository;

import lombok.AllArgsConstructor;

@Component
@AllArgsConstructor
public class ShopDataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            return;
        }

        productRepository.saveAll(List.of(
                product("Boxy Crop Shirt", 699, "tops", "women", 18, "/images/boxycropshirt.jpg"),
                product("Silk Satin Top", 899, "tops", "women", 14, "/images/SilkSatinTop.jpg"),
                product("Floral Print Blouse", 799, "tops", "women", 16, "/images/FloralPrintBlouse.jpg"),
                product("Basic Cotton Top", 499, "tops", "women", 22, "/images/BasicCottonTop.jpg"),
                product("High Waisted Jeans", 1199, "bottoms", "women", 12, "/images/High-WaistedJeans.jpg"),
                product("Long Denim Skirt", 999, "bottoms", "women", 10, "/images/LongDenimSkirt.jpg"),
                product("Denim Skirt", 799, "bottoms", "women", 15, "/images/DenimSkirt.jpg"),
                product("Platform Heels", 1499, "footwear", "women", 8, "/images/platformheels.png"),
                product("Pointed Toe Flats", 1199, "footwear", "women", 9, "/images/PointedToeFlats.jpg"),
                product("Women Slippers", 499, "footwear", "women", 20, "/images/womenslippers.png"),
                product("Hair Scrunchies", 199, "accessories", "women", 35, "/images/HairScrunchies.jpg"),
                product("Timex Woman Watch", 1899, "accessories", "women", 7, "/images/Timex_Womanwatch.png"),
                product("Wool Beret Hat", 599, "accessories", "women", 13, "/images/woolberethat.jpg"),
                product("Oversized Graphic Shirt", 699, "tops", "men", 18, "/images/oversizedgraphicshirt.jpg"),
                product("Black Flannel", 999, "tops", "men", 12, "/images/blackflannel.jpg"),
                product("Slim Fit Linen Polo", 1199, "tops", "men", 10, "/images/slimfitlinenpoloshirt.jpg"),
                product("Quarter Zip Pullover", 1299, "tops", "men", 9, "/images/quarterzip.jpg"),
                product("Baggy Black Denim", 1399, "bottoms", "men", 11, "/images/baggyblackdenim.jpg"),
                product("Baggy Cargo Pants", 1299, "bottoms", "men", 13, "/images/baggycargo.jpg"),
                product("Slim Fit Jeans", 1199, "bottoms", "men", 12, "/images/slimfitjeans.jpg"),
                product("Blue Jorts", 899, "bottoms", "men", 14, "/images/bluejorts.jpg"),
                product("Palermo Blue Sneakers", 2299, "footwear", "men", 8, "/images/palermoblue.jpg"),
                product("Black Leather Boots", 2499, "footwear", "men", 6, "/images/blackleatherboots.jpg"),
                product("Penny Loafers", 1899, "footwear", "men", 9, "/images/pennyloafers.jpg"),
                product("Black Leather Messenger Bag", 1699, "accessories", "men", 10, "/images/blackleathermessengerbag.jpg"),
                product("Brown Leather Wallet", 899, "accessories", "men", 18, "/images/brownleatherwallet.jpg"),
                product("Sunglasses Men", 699, "accessories", "men", 15, "/images/sunglassesmen.jpg"),
                product("Canvas Tote Bag", 799, "accessories", "women", 16, "/images/canvas_totebag.jpg"),
                product("Yoga Mat", 899, "others", "women", 12, "/images/yogamat.jpg"),
                product("Zara Black Perfume", 1299, "others", "men", 10, "/images/zarablackperfume.jpg")
        ));
    }

    private Product product(String name, Integer price, String category, String section, Integer stocks, String imageUrl) {
        return Product.builder()
                .productName(name)
                .productPrice(price)
                .category(category)
                .section(section)
                .stocks(stocks)
                .imageUrl(imageUrl)
                .build();
    }
}