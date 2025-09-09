# ============================================================
# Elegant Firefly Maps in R - Multi-Class Compatible (Terra-only version)
# Works with rasters:
#   NA = outside study area (transparent)
#   0  = no change
#   1  = negative change (orange glow)
#   2  = positive change (green glow)
# ============================================================

library(terra)
library(ggplot2)
library(dplyr)
library(scales)
library(ggnewscale)


# ------------------------------------------------------------
# Function to create Gaussian kernel for smooth glow effects
# ------------------------------------------------------------
create_gaussian_kernel <- function(size, sigma) {
  if (size %% 2 == 0) size <- size + 1
  kernel <- matrix(0, nrow = size, ncol = size)
  center <- (size + 1) / 2
  for (i in 1:size) {
    for (j in 1:size) {
      dist_sq <- (i - center)^2 + (j - center)^2
      kernel[i, j] <- exp(-dist_sq / (2 * sigma^2))
    }
  }
  kernel <- kernel / sum(kernel)
  return(kernel)
}

# ------------------------------------------------------------
# Function to prepare binary raster for glow processing
# ------------------------------------------------------------
prepare_binary_raster <- function(binary_raster, intensity_value = 1.0) {
  processed_raster <- binary_raster
  vals <- values(processed_raster)
  vals[vals == 1] <- intensity_value
  vals[vals == 0] <- 0
  values(processed_raster) <- vals
  return(processed_raster)
}

# ------------------------------------------------------------
# Function to apply Gaussian blur
# ------------------------------------------------------------
apply_gaussian_blur_binary <- function(raster_data, sigma = 2, kernel_size = NULL) {
  if (is.null(kernel_size)) {
    kernel_size <- ceiling(6 * sigma)
    if (kernel_size %% 2 == 0) kernel_size <- kernel_size + 1
  }
  if (kernel_size < 3) kernel_size <- 3
  gaussian_kernel <- create_gaussian_kernel(kernel_size, sigma)
  tryCatch({
    blurred <- focal(raster_data, w = gaussian_kernel, fun = "sum",
                     na.rm = TRUE, expand = TRUE)
  }, error = function(e) {
    warning("Gaussian kernel failed, using circular focal window instead")
    radius <- ceiling(sigma)
    circular_kernel <- matrix(0, nrow = radius*2+1, ncol = radius*2+1)
    center <- radius + 1
    for(i in 1:(radius*2+1)) {
      for(j in 1:(radius*2+1)) {
        if(sqrt((i-center)^2 + (j-center)^2) <= radius) {
          circular_kernel[i,j] <- 1
        }
      }
    }
    circular_kernel <- circular_kernel / sum(circular_kernel)
    blurred <- focal(raster_data, w = circular_kernel, fun = "sum",
                     na.rm = TRUE, expand = TRUE)
  })
  return(blurred)
}

# ------------------------------------------------------------
# Function to create glow layers
# ------------------------------------------------------------
create_smooth_glow_layers_binary <- function(raster_data,
                                             blur_sigmas = c(0.5, 1.5, 3, 6),
                                             intensities = c(1, 0.6, 0.3, 0.15)) {
  glow_layers <- list()
  processed_raster <- prepare_binary_raster(raster_data, intensity_value = 1.0)
  for (i in 1:length(blur_sigmas)) {
    blurred_layer <- apply_gaussian_blur_binary(processed_raster, sigma = blur_sigmas[i])
    vals <- values(blurred_layer)
    vals <- vals * intensities[i]
    values(blurred_layer) <- vals
    glow_layers[[paste0("glow_", i)]] <- blurred_layer
  }
  return(glow_layers)
}

# ------------------------------------------------------------
# Function to enhance clustering glow
# ------------------------------------------------------------
enhance_clustering_glow_binary <- function(raster_data, neighborhood_radius = 5) {
  kernel_size <- neighborhood_radius * 2 + 1
  focal_matrix <- matrix(0, nrow = kernel_size, ncol = kernel_size)
  center <- ceiling(kernel_size / 2)
  for (i in 1:kernel_size) {
    for (j in 1:kernel_size) {
      dist <- sqrt((i - center)^2 + (j - center)^2)
      if (dist <= neighborhood_radius) {
        focal_matrix[i, j] <- 1
      }
    }
  }
  local_density <- focal(raster_data, w = focal_matrix, fun = "sum",
                         na.rm = TRUE, expand = TRUE)
  density_values <- values(local_density)
  if (all(is.na(density_values))) return(raster_data)
  max_density <- max(density_values, na.rm = TRUE)
  min_density <- min(density_values, na.rm = TRUE)
  if (max_density > min_density && max_density > 0) {
    normalized_density <- (density_values - min_density) / (max_density - min_density)
    enhancement_factor <- 1 + normalized_density^0.7 * 2
    original_values <- values(raster_data)
    enhanced_values <- original_values * enhancement_factor
    enhanced_values[original_values == 0] <- 0
    enhanced_raster <- raster_data
    values(enhanced_raster) <- enhanced_values
    return(enhanced_raster)
  }
  return(raster_data)
}

# ------------------------------------------------------------
# NEW: Split raster into negative (1) and positive (2)
# ------------------------------------------------------------
split_change_raster <- function(r) {
  neg_r <- r
  pos_r <- r
  vals <- values(r)
  vals_neg <- ifelse(vals == 1, 1, 0)
  values(neg_r) <- vals_neg
  vals_pos <- ifelse(vals == 2, 1, 0)
  values(pos_r) <- vals_pos
  return(list(negative = neg_r, positive = pos_r))
}

# ------------------------------------------------------------
# NEW: Firefly map for positive/negative changes
# ------------------------------------------------------------
create_firefly_change_map <- function(raster_data,
                                      background_color = "#000a0f",
                                      neg_core_color = "#fd6211",
                                      neg_glow_colors = c("#fd6211", "#fd7f33", "#fd9f66", "#fdc599"),
                                      pos_core_color = "#78ff00",
                                      pos_glow_colors = c("#78ff00", "#99ff33", "#bbff66", "#ddff99"),
                                      blur_sigmas = c(1.5, 4, 8, 16),
                                      intensities = c(1.2, 0.8, 0.4, 0.2),
                                      alpha_base = 0.9,
                                      enhance_clusters = TRUE) {
  split_layers <- split_change_raster(raster_data)
  neg_r <- split_layers$negative
  pos_r <- split_layers$positive
  if (enhance_clusters) {
    neg_r <- enhance_clustering_glow_binary(neg_r, neighborhood_radius = 3)
    pos_r <- enhance_clustering_glow_binary(pos_r, neighborhood_radius = 3)
  }
  neg_glows <- create_smooth_glow_layers_binary(neg_r, blur_sigmas, intensities)
  pos_glows <- create_smooth_glow_layers_binary(pos_r, blur_sigmas, intensities)
  neg_core_df <- as.data.frame(neg_r, xy = TRUE)
  pos_core_df <- as.data.frame(pos_r, xy = TRUE)
  names(neg_core_df)[3] <- "intensity"
  names(pos_core_df)[3] <- "intensity"
  neg_core_df <- neg_core_df[!is.na(neg_core_df$intensity) & neg_core_df$intensity > 0, ]
  pos_core_df <- pos_core_df[!is.na(pos_core_df$intensity) & pos_core_df$intensity > 0, ]
  p <- ggplot() +
    theme_void() +
    theme(
      plot.background = element_rect(fill = background_color, color = NA),
      panel.background = element_rect(fill = background_color, color = NA),
      legend.position = "none",
      plot.margin = margin(5, 5, 5, 5)
    )
  for (i in length(neg_glows):1) {
    df <- as.data.frame(neg_glows[[i]], xy = TRUE)
    names(df)[3] <- "intensity"
    df <- df[!is.na(df$intensity) & df$intensity > 0.01, ]
    if (nrow(df) > 0) {
      p <- p +
        geom_raster(data = df,
                    aes(x = x, y = y, alpha = intensity * alpha_base),
                    fill = neg_glow_colors[min(i, length(neg_glow_colors))],
                    interpolate = TRUE)
    }
  }
  for (i in length(pos_glows):1) {
    df <- as.data.frame(pos_glows[[i]], xy = TRUE)
    names(df)[3] <- "intensity"
    df <- df[!is.na(df$intensity) & df$intensity > 0.01, ]
    if (nrow(df) > 0) {
      p <- p +
        geom_raster(data = df,
                    aes(x = x, y = y, alpha = intensity * alpha_base),
                    fill = pos_glow_colors[min(i, length(pos_glow_colors))],
                    interpolate = TRUE)
    }
  }
  if (nrow(neg_core_df) > 0) {
    p <- p +
      geom_raster(data = neg_core_df,
                  aes(x = x, y = y, alpha = pmin(intensity, 1.0)),
                  fill = neg_core_color,
                  interpolate = FALSE)
  }
  if (nrow(pos_core_df) > 0) {
    p <- p +
      geom_raster(data = pos_core_df,
                  aes(x = x, y = y, alpha = pmin(intensity, 1.0)),
                  fill = pos_core_color,
                  interpolate = FALSE)
  }
  p <- p + scale_alpha_identity()
  return(p)
}

# ------------------------------------------------------------
# Create sample MULTI-CLASS raster (0, 1, 2, NA) for testing
# ------------------------------------------------------------
create_sample_multi_raster <- function(nrows = 100, ncols = 150,
                                       xmin = 0, xmax = 15, ymin = 0, ymax = 10,
                                       n_neg_clusters = 4,
                                       n_pos_clusters = 4,
                                       neg_points_range = 20:35,
                                       pos_points_range = 20:35,
                                       n_scattered = 50) {
  set.seed(123)  # for reproducibility

  # Base raster with 0 = no change
  r <- rast(nrows = nrows, ncols = ncols, xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax)
  values(r) <- 0

  # Collect points for negative and positive clusters
  change_points <- data.frame()

  # Negative clusters (value = 1)
  for (i in 1:n_neg_clusters) {
    cluster_x <- runif(1, xmin + 1, xmax - 1)
    cluster_y <- runif(1, ymin + 1, ymax - 1)
    n_points <- sample(neg_points_range, 1)
    cluster_points <- data.frame(
      x = rnorm(n_points, cluster_x, 1.0),
      y = rnorm(n_points, cluster_y, 0.7),
      change = 1
    )
    change_points <- rbind(change_points, cluster_points)
  }

  # Positive clusters (value = 2)
  for (i in 1:n_pos_clusters) {
    cluster_x <- runif(1, xmin + 1, xmax - 1)
    cluster_y <- runif(1, ymin + 1, ymax - 1)
    n_points <- sample(pos_points_range, 1)
    cluster_points <- data.frame(
      x = rnorm(n_points, cluster_x, 1.0),
      y = rnorm(n_points, cluster_y, 0.7),
      change = 2
    )
    change_points <- rbind(change_points, cluster_points)
  }

  # Scattered changes (random 1s and 2s)
  scattered_points <- data.frame(
    x = runif(n_scattered, xmin, xmax),
    y = runif(n_scattered, ymin, ymax),
    change = sample(c(1, 2), n_scattered, replace = TRUE)
  )
  change_points <- rbind(change_points, scattered_points)

  # Keep points inside bounds
  change_points <- change_points[
    change_points$x >= xmin & change_points$x <= xmax &
      change_points$y >= ymin & change_points$y <= ymax, ]

  # Rasterize points (take max value so 2 overrides 1 in overlaps)
  if (nrow(change_points) > 0) {
    change_vect <- vect(change_points, geom = c("x", "y"))
    values(change_vect) <- data.frame(change = change_points$change)
    change_raster <- rasterize(change_vect, r, field = "change", fun = "max")
    # Fill remaining NAs with 0 (no change)
    vals <- values(change_raster)
    vals[is.na(vals)] <- 0
    values(change_raster) <- vals
  } else {
    change_raster <- r
  }

  # Mask out part of raster to create NA (outside study area)
  # Example: circular study area mask
  mask <- rast(r)
  coords <- xyFromCell(mask, 1:ncell(mask))
  center <- c(mean(c(xmin, xmax)), mean(c(ymin, ymax)))
  radius <- min(xmax - xmin, ymax - ymin) / 2.2
  inside <- sqrt((coords[,1] - center[1])^2 + (coords[,2] - center[2])^2) <= radius
  mask_vals <- ifelse(inside, 1, NA)
  values(mask) <- mask_vals
  change_raster <- mask(change_raster, mask)

  return(change_raster)
}

# ------------------------------------------------------------
# Example usage:
# ------------------------------------------------------------
sample_multi_raster <- create_sample_multi_raster()

# Inspect value distribution
print("Sample raster values:")
print(table(values(sample_multi_raster), useNA = "ifany"))

# Visualize with the firefly map
test_map <- create_firefly_change_map(sample_multi_raster)
print(test_map)

# Save the map
ggsave("firefly_change_map.png", plot = test_map, width = 10, height = 7, dpi = 300)
