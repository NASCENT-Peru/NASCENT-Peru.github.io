# Elegant Firefly Maps in R - Binary Data Compatible (Terra-only version)
# Creates beautiful, soft glowing effects for binary 0/1 rasters (land-use change data)

library(terra)
library(ggplot2)
library(dplyr)
library(scales)
library(ggnewscale)

# Function to create Gaussian kernel for smooth glow effects (terra-compatible)
create_gaussian_kernel <- function(size, sigma) {
  # Ensure odd size for proper centering
  if (size %% 2 == 0) size <- size + 1

  kernel <- matrix(0, nrow = size, ncol = size)
  center <- (size + 1) / 2

  for (i in 1:size) {
    for (j in 1:size) {
      dist_sq <- (i - center)^2 + (j - center)^2
      kernel[i, j] <- exp(-dist_sq / (2 * sigma^2))
    }
  }

  # Normalize kernel so it sums to 1 (required for terra focal)
  kernel <- kernel / sum(kernel)

  return(kernel)
}

# Function to prepare binary raster for glow processing
prepare_binary_raster <- function(binary_raster, intensity_value = 1.0) {
  # Convert 0/1 raster to proper intensity values
  # 0 stays as 0 (no glow), 1 becomes intensity_value

  # Create a copy to avoid modifying original
  processed_raster <- binary_raster

  # Set all 1 values to the desired intensity
  vals <- values(processed_raster)
  vals[vals == 1] <- intensity_value
  vals[vals == 0] <- 0
  values(processed_raster) <- vals

  return(processed_raster)
}

# Function to apply Gaussian blur to binary SpatRaster for smooth glow
apply_gaussian_blur_binary <- function(raster_data, sigma = 2, kernel_size = NULL) {
  if (is.null(kernel_size)) {
    kernel_size <- ceiling(6 * sigma)
    if (kernel_size %% 2 == 0) kernel_size <- kernel_size + 1
  }

  # Ensure minimum kernel size
  if (kernel_size < 3) kernel_size <- 3

  # Create Gaussian kernel
  gaussian_kernel <- create_gaussian_kernel(kernel_size, sigma)

  # Apply convolution using focal - terra expects matrix input
  tryCatch({
    blurred <- focal(raster_data, w = gaussian_kernel, fun = "sum", na.rm = TRUE, expand = TRUE)
  }, error = function(e) {
    # Fallback: use a simpler approach if gaussian kernel fails
    warning("Gaussian kernel failed, using circular focal window instead")
    # Create simple circular kernel
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
    blurred <- focal(raster_data, w = circular_kernel, fun = "sum", na.rm = TRUE, expand = TRUE)
  })

  return(blurred)
}

# Function to create multiple glow layers with different blur levels (binary-compatible)
create_smooth_glow_layers_binary <- function(raster_data,
                                             blur_sigmas = c(0.5, 1.5, 3, 6),
                                             intensities = c(1, 0.6, 0.3, 0.15)) {

  glow_layers <- list()

  # First prepare the binary raster
  processed_raster <- prepare_binary_raster(raster_data, intensity_value = 1.0)

  for (i in 1:length(blur_sigmas)) {
    # Create blurred layer
    blurred_layer <- apply_gaussian_blur_binary(processed_raster, sigma = blur_sigmas[i])

    # Scale intensity
    vals <- values(blurred_layer)
    vals <- vals * intensities[i]
    values(blurred_layer) <- vals

    glow_layers[[paste0("glow_", i)]] <- blurred_layer
  }

  return(glow_layers)
}

# Enhanced function to boost glow in clustered areas (binary-compatible)
enhance_clustering_glow_binary <- function(raster_data, neighborhood_radius = 5) {
  # For binary data, we want to enhance areas where there are many 1s nearby

  # Create circular focal window
  kernel_size <- neighborhood_radius * 2 + 1
  focal_matrix <- matrix(0, nrow = kernel_size, ncol = kernel_size)
  center <- ceiling(kernel_size / 2)

  # Create circular kernel
  for (i in 1:kernel_size) {
    for (j in 1:kernel_size) {
      dist <- sqrt((i - center)^2 + (j - center)^2)
      if (dist <= neighborhood_radius) {
        focal_matrix[i, j] <- 1
      }
    }
  }

  # Calculate local density (count of 1s in neighborhood)
  local_density <- focal(raster_data, w = focal_matrix, fun = "sum", na.rm = TRUE, expand = TRUE)

  # Normalize density values
  density_values <- values(local_density)
  if (all(is.na(density_values))) return(raster_data)

  max_density <- max(density_values, na.rm = TRUE)
  min_density <- min(density_values, na.rm = TRUE)

  if (max_density > min_density && max_density > 0) {
    normalized_density <- (density_values - min_density) / (max_density - min_density)
    # Apply power transformation for more dramatic clustering effect
    enhancement_factor <- 1 + normalized_density^0.7 * 2

    # Only enhance cells that originally had value = 1
    original_values <- values(raster_data)
    enhanced_values <- original_values * enhancement_factor

    # Ensure 0 values stay 0
    enhanced_values[original_values == 0] <- 0

    # Create output raster
    enhanced_raster <- raster_data
    values(enhanced_raster) <- enhanced_values

    return(enhanced_raster)
  }

  return(raster_data)
}

# Main function to create elegant firefly map (binary-compatible)
create_elegant_firefly_map <- function(raster_data,
                                       background_color = "#000a0f",
                                       glow_colors = c("#4a7c59", "#7eb68a", "#b8d4a0", "#f0f8b0"),
                                       core_color = "#ffffff",
                                       enhance_clusters = TRUE,
                                       blur_sigmas = c(0.8, 2, 4, 8),
                                       intensities = c(0.9, 0.5, 0.25, 0.1),
                                       alpha_base = 0.7,
                                       is_binary = TRUE) {

  # Enhance clustering if requested
  if (enhance_clusters) {
    if (is_binary) {
      raster_data <- enhance_clustering_glow_binary(raster_data, neighborhood_radius = 3)
    } else {
      raster_data <- enhance_clustering_glow_binary(raster_data, neighborhood_radius = 3)
    }
  }

  # Create glow layers
  if (is_binary) {
    glow_layers <- create_smooth_glow_layers_binary(raster_data, blur_sigmas, intensities)
  } else {
    glow_layers <- create_smooth_glow_layers_binary(raster_data, blur_sigmas, intensities)
  }

  # Get original data points for cores (only cells with value = 1 for binary data)
  core_df <- as.data.frame(raster_data, xy = TRUE)
  names(core_df)[3] <- "intensity"

  if (is_binary) {
    # For binary data, only show cores where original value was 1
    core_df <- core_df[!is.na(core_df$intensity) & core_df$intensity > 0, ]
  } else {
    core_df <- core_df[!is.na(core_df$intensity), ]
  }

  # Create the base plot
  p <- ggplot() +
    theme_void() +
    theme(
      plot.background = element_rect(fill = background_color, color = NA),
      panel.background = element_rect(fill = background_color, color = NA),
      legend.position = "none",
      plot.margin = margin(5, 5, 5, 5)
    )

  # Add glow layers from largest to smallest using geom_raster with fixed colors
  for (i in length(glow_layers):1) {
    df <- as.data.frame(glow_layers[[i]], xy = TRUE)
    names(df)[3] <- "intensity"
    # Filter out very low values and NA
    threshold <- 0.01  # Small threshold for binary data
    df <- df[!is.na(df$intensity) & df$intensity > threshold, ]

    if (nrow(df) > 0) {
      # Use a single color for each glow layer with alpha mapping
      p <- p +
        geom_raster(data = df,
                    aes(x = x, y = y, alpha = intensity * alpha_base),
                    fill = glow_colors[min(i, length(glow_colors))],
                    interpolate = TRUE)
    }
  }

  # Add original pixels as bright cores on top - single color
  if (nrow(core_df) > 0) {
    p <- p +
      geom_raster(data = core_df,
                  aes(x = x, y = y, alpha = pmin(intensity, 1.0)),  # Cap alpha at 1
                  fill = core_color,
                  interpolate = FALSE)
  }

  # Set alpha scale once at the end
  p <- p + scale_alpha_identity()

  return(p)
}

# Function to create sample BINARY raster data (0s and 1s) for testing
create_sample_binary_raster <- function() {
  set.seed(123)
  r <- rast(nrows = 100, ncols = 150, xmin = 0, xmax = 15, ymin = 0, ymax = 10)

  # Initialize with all 0s
  values(r) <- 0

  # Create clustered areas of land use change (1s)
  firefly_points <- data.frame()

  # Large change clusters
  for(i in 1:4) {
    cluster_x <- runif(1, 2, 13)
    cluster_y <- runif(1, 2, 8)
    n_points <- sample(20:35, 1)

    cluster_points <- data.frame(
      x = rnorm(n_points, cluster_x, 1.0),
      y = rnorm(n_points, cluster_y, 0.7)
    )
    firefly_points <- rbind(firefly_points, cluster_points)
  }

  # Medium change clusters
  for(i in 1:8) {
    cluster_x <- runif(1, 1, 14)
    cluster_y <- runif(1, 1, 9)
    n_points <- sample(8:15, 1)

    cluster_points <- data.frame(
      x = rnorm(n_points, cluster_x, 0.6),
      y = rnorm(n_points, cluster_y, 0.4)
    )
    firefly_points <- rbind(firefly_points, cluster_points)
  }

  # Scattered individual changes
  scattered_points <- data.frame(
    x = runif(60, 0, 15),
    y = runif(60, 0, 10)
  )
  firefly_points <- rbind(firefly_points, scattered_points)

  # Remove points outside bounds
  firefly_points <- firefly_points[firefly_points$x >= 0 & firefly_points$x <= 15 &
                                     firefly_points$y >= 0 & firefly_points$y <= 10, ]

  # Convert to binary SpatRaster
  if(nrow(firefly_points) > 0) {
    firefly_vect <- vect(firefly_points, geom = c("x", "y"))
    # Add a binary field (all 1s for land use change)
    values(firefly_vect) <- data.frame(change = 1)

    # Rasterize - this will put 1s where points are, 0s elsewhere
    change_raster <- rasterize(firefly_vect, r, field = "change", fun = "max")

    # Fill NAs with 0s
    vals <- values(change_raster)
    vals[is.na(vals)] <- 0
    values(change_raster) <- vals
  } else {
    change_raster <- r
  }

  return(change_raster)
}

# Example usage with binary land-use change data
sample_binary_raster <- create_sample_binary_raster()

# Check the values in our binary raster
print("Binary raster values:")
print(table(values(sample_binary_raster), useNA = "ifany"))

PA_rast <- rast("Y:/CH_ValPar.CH/03_workspaces/07_Modeling/LULCC_CH/Data/Spat_prob_perturb_layers/Protected_areas/New_PAs/EI_NAT_new_PAs_2025.tif")


# Create elegant firefly map for BINARY data (0s and 1s)
binary_firefly_map <- create_elegant_firefly_map(
  PA_rast,
  is_binary = TRUE,  # Important: specify this is binary data
  blur_sigmas = c(1.5, 4, 8, 16),        # Larger glow for land use changes
  intensities = c(1.2, 0.8, 0.4, 0.2),   # Bright intensities
  alpha_base = 0.9                        # High visibility
)
print("Binary Firefly Map (Land Use Changes):")
print(binary_firefly_map)

# Create extra bright version for land use changes
extra_bright_binary_map <- create_elegant_firefly_map(
  sample_binary_raster,
  is_binary = TRUE,
  blur_sigmas = c(2, 6, 12, 24),         # Very large glow
  intensities = c(1.8, 1.2, 0.8, 0.4),   # Very bright
  alpha_base = 1.0,
  glow_colors = c("#2d5a3d", "#4a7c59", "#7eb68a", "#b8d4a0"),  # Slightly brighter greens
  core_color = "#ffff99"                  # Bright yellow cores
)
print("Extra Bright Binary Firefly Map:")
print(extra_bright_binary_map)

# Function to work with your own BINARY raster data (0s and 1s)
create_firefly_from_binary_raster <- function(raster_path) {
  # Load your binary raster using terra
  your_binary_raster <- rast(raster_path)

  # Check if it's actually binary
  unique_vals <- unique(values(your_binary_raster))
  unique_vals <- unique_vals[!is.na(unique_vals)]

  print(paste("Unique values in raster:", paste(unique_vals, collapse = ", ")))

  # Create the firefly map for binary data
  firefly_map <- create_elegant_firefly_map(
    your_binary_raster,
    is_binary = TRUE,
    blur_sigmas = c(2, 6, 12, 20),        # Large glow for land use changes
    intensities = c(1.5, 1.0, 0.6, 0.3),  # Bright visibility
    alpha_base = 0.9
  )

  return(firefly_map)
}

# Example for loading your own binary raster:
# my_land_use_firefly_map <- create_firefly_from_binary_raster("path/to/your/binary_raster.tif")

# Save the binary firefly map
ggsave("land_use_changes_firefly.png", binary_firefly_map,
        width = 16, height = 10, dpi = 300, bg = "transparent")





