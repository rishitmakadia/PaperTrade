package com.ppt.papertrade.dto.response;

import lombok.*;

/**
 * Stock news article response.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsItemResponse {

    private String title;
    private String publisher;
    private String link;
    private String time;
    private String thumbnail;
}
