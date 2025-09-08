# Load libraries
packs <- c("stringr", "terra", "future", "future.apply", "readxl",
           "data.table", "tidyr", "yaml", "dplyr", "viridis", "ggplot2",
           "tidyterra", "treemapify", "jsonlite", "magick", "grDevices")
invisible(lapply(packs, require, character.only = TRUE))

### =========================================================================
### Functions
### =========================================================================

#' Save Raster as 8-bit Indexed PNG
#'
#' This function saves a raster object as an 8-bit indexed color PNG file
#' using the magick package while preserving the original colors.
#'
#' @param raster_obj A raster object to be saved
#' @param output_path Character string specifying the output PNG file path
#' @param color_palette Vector of colors to use for the raster (hex colors)
#' @param width Numeric, width of the output image in specified units (default: 25)
#' @param height Numeric, height of the output image in specified units (default: 20)
#' @param resolution Numeric, resolution in DPI (default: 300)
#' @param units Character, units for width and height ("cm", "in", "px") (default: "cm")
#' @param margins Numeric vector of length 4, margins in the order c(bottom, left, top, right) (default: c(0, 0, 0, 0))
#' @param background Character, background color (default: "transparent")
#' @param colorspace Character, colorspace for quantization ("sRGB" or "rgb") (default: "sRGB")
#' @param max_colors Numeric, maximum number of colors for indexed palette (default: 256)
#' @param show_legend Logical, whether to show the raster legend (default: FALSE)
#' @param axes Logical, whether to show axes (default: FALSE)
#' @param box Logical, whether to show a box around the plot (default: FALSE)
#' @param cleanup_temp Logical, whether to remove temporary files (default: TRUE)
#' @param verbose Logical, whether to print progress messages (default: FALSE)
#'
#' @return Invisibly returns the magick image object of the final indexed PNG
#'
#' @examples
#' \dontrun{
#' # Basic usage
#' save_indexed_png(my_raster, "output.png", my_colors)
#'
#' # With custom dimensions and margins
#' save_indexed_png(my_raster, "output.png", my_colors,
#'                  width = 30, height = 25, margins = c(1, 1, 1, 1))
#'
#' # High resolution output
#' save_indexed_png(my_raster, "output.png", my_colors,
#'                  resolution = 600, units = "in", width = 8, height = 6)
#' }
#'
#' @export
save_indexed_png <- function(raster_obj,
                           output_path,
                           color_palette,
                           width = 25,
                           height = 20,
                           resolution = 300,
                           units = "cm",
                           margins = c(0, 0, 0, 0),
                           background = "transparent",
                           colorspace = "sRGB",
                           max_colors = 256,
                           show_legend = FALSE,
                           axes = FALSE,
                           box = FALSE,
                           cleanup_temp = TRUE,
                           verbose = FALSE) {

  # Load required libraries
  if (!requireNamespace("magick", quietly = TRUE)) {
    stop("Package 'magick' is required but not installed.")
  }
  if (!requireNamespace("raster", quietly = TRUE)) {
    stop("Package 'raster' is required but not installed.")
  }

  library(magick)
  library(raster)
  library(grDevices)

  if (verbose) cat("Creating temporary PNG...\n")

  # Create temporary PNG file
  temp_png <- tempfile(fileext = ".png")

  # Create the standard PNG first
  png(temp_png,
      width = width,
      height = height,
      res = resolution,
      bg = background,
      units = units)

  # Set margins
  par(mar = margins)

  # Plot the raster
  plot(raster_obj,
       col = color_palette,
       legend = show_legend,
       axes = axes,
       box = box)

  dev.off()

  if (verbose) cat("Converting to indexed PNG...\n")

  # Read the temporary PNG with magick
  img <- image_read(temp_png)

  # Convert to 8-bit indexed color PNG while preserving colors
  img_indexed <- img %>%
    image_quantize(max = max_colors,
                   colorspace = colorspace,
                   dither = FALSE) %>%
    image_strip()  # Remove unnecessary metadata

  # Write the indexed PNG
  image_write(img_indexed, output_path, format = "png", depth = 8)

  if (verbose) cat(paste("Saved indexed PNG to:", output_path, "\n"))

  # Clean up temporary file
  if (cleanup_temp) {
    unlink(temp_png)
    if (verbose) cat("Cleaned up temporary files.\n")
  } else {
    if (verbose) cat(paste("Temporary file saved at:", temp_png, "\n"))
  }

  # Return the magick image object invisibly
  invisible(img_indexed)
}

# Helper function to inspect the saved PNG properties
#' Inspect Indexed PNG Properties
#' This function inspects the properties of an indexed PNG file
#' using both the magick and png packages.
#' @param png_path Character string specifying the path to the PNG file
#' @return Invisibly returns a list containing information from both magick and png packages
inspect_indexed_png <- function(png_path) {
  if (!requireNamespace("magick", quietly = TRUE)) {
    stop("Package 'magick' is required but not installed.")
  }
  if (!requireNamespace("png", quietly = TRUE)) {
    stop("Package 'png' is required but not installed.")
  }

  library(magick)
  library(png)

  cat("=== PNG Inspection Results ===\n")

  # Method 1: Using magick
  img <- image_read(png_path)
  info <- image_info(img)

  cat("Magick Information:\n")
  cat(paste("  Dimensions:", info$width, "x", info$height, "\n"))
  cat(paste("  Color space:", info$colorspace, "\n"))
  cat(paste("  Depth:", info$depth, "bit\n"))
  cat(paste("  Format:", info$format, "\n"))

  # Method 2: Using png package for detailed info
  png_info <- readPNG(png_path, info = TRUE)
  info_attr <- attr(png_info, "info")

  color_types <- c("0" = "Grayscale",
                   "2" = "RGB",
                   "3" = "Indexed",
                   "4" = "Grayscale + Alpha",
                   "6" = "RGBA")

  cat("\nDetailed PNG Information:\n")
  cat(paste("  Color Type:", color_types[as.character(info_attr$color.type)],
            "(", info_attr$color.type, ")\n"))
  cat(paste("  Is Indexed:", info_attr$color.type == 3, "\n"))
  cat(paste("  Bit Depth:", info_attr$bit.depth, "\n"))

  return(invisible(list(magick_info = info, png_info = info_attr)))
}


#' create a Gaussian kernel
#' This function creates a Gaussian kernel matrix
#' @param size Size of the kernel (must be odd)
#' @param sigma Standard deviation of the Gaussian
#' @return A matrix representing the Gaussian kernel
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

#' This function prepares a binary raster for glow processing
#' by setting the intensity of '1' values to a specified value
#' and '0' values to zero.
#' @param binary_raster A binary raster object (0s and 1s)
#' @param intensity_value Numeric value to set for '1' values (default: 1.0)
#' @return A processed raster with adjusted intensity values
prepare_binary_raster <- function(binary_raster, intensity_value = 1.0) {
  processed_raster <- binary_raster
  vals <- values(processed_raster)
  vals[vals == 1] <- intensity_value
  vals[vals == 0] <- 0
  values(processed_raster) <- vals
  return(processed_raster)
}


#' This function applies Gaussian blur to a binary raster
#' using a Gaussian kernel. If the Gaussian kernel fails,
#' it falls back to a circular focal window.
#' @param raster_data A binary raster object (0s and 1s)
#' @param sigma Standard deviation for the Gaussian kernel (default: 2)
#' @param kernel_size Size of the Gaussian kernel (must be odd, default: NULL to auto
#' calculate based on sigma)
#' @return A raster object with Gaussian blur applied
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

#' This function creates multiple smooth glow layers
#' from a binary raster using Gaussian blur
#' @param raster_data A binary raster object (0s and 1s)
#' @param blur_sigmas Numeric vector of standard deviations for Gaussian blur
#' (default: c(0.5, 1.5, 3, 6))
#' @param intensities Numeric vector of intensity multipliers for each glow layer
#' (default: c(1, 0.6, 0.3, 0.15))
#' @return A list of raster objects representing the glow layers
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

#' This function enhances clustering in a binary raster
#' by calculating local density and amplifying values
#' based on neighborhood density.
#' @param raster_data A binary raster object (0s and 1s)
#' @param neighborhood_radius Radius of the neighborhood to consider (default: 5)
#' @return A raster object with enhanced clustering
#' Note: This function is designed for binary rasters
#' and may not work correctly with multi-class rasters.
#' Use with caution.
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

#' This function splits a raster with values 0 (no change),
#' 1 (negative change), and 2 (positive change)
#' into two separate binary rasters.
#' @param r A raster object with values 0, 1, and 2
#' @return A list containing two rasters:
#' "negative" with 1s for negative change and 0s elsewhere,
#' and "positive" with 1s for positive change and 0s elsewhere.
#' Note: This function is designed for rasters with
#' values 0, 1, and 2 only.
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

#' Create Firefly Change Map
#' This function creates a firefly-style change map
#' using ggplot2 to visualize positive and negative changes
#' with glowing effects.
#' @param raster_data A raster object with values 0 (no change),
#' 1 (negative change), and 2 (positive change)
#' @param background_color Background color for the map (default: "#000a0f")
#' @param neg_core_color Core color for negative changes (default: "#fd6211")
#' @param neg_glow_colors Vector of glow colors for negative changes
#' (default: c("#fd6211", "#fd7f33", "#fd9f66", "#fdc599"))
#' @param pos_core_color Core color for positive changes (default: "#78ff00")
#' @param pos_glow_colors Vector of glow colors for positive changes
#' (default: c("#78ff00", "#99ff33", "#bbff66", "#ddff99"))
#' @param blur_sigmas Numeric vector of standard deviations for Gaussian blur
#' (default: c(1.5, 4, 8, 16))
#' @param intensities Numeric vector of intensity multipliers for each glow layer
#' (default: c(1.2, 0.8, 0.4, 0.2))
#' @param alpha_base Base alpha value for glow layers (default: 0.9)
#' @param enhance_clusters Logical, whether to enhance clustering in the binary rasters
#' (default: TRUE)
#' @return A ggplot2 object representing the firefly change map
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



### =========================================================================
### Main
### =========================================================================

#crs for maps
Proj <- "+proj=somerc +init=epsg:2056"

# dir for aggregated lulc maps
map_dir <- "X:/NASCENT-Peru/03_workspaces/02_modelling/Data/LULC/MapBiomas-aggregated-classes"

output_dir <- "outputs/data/lulc"
if(!dir.exists(output_dir)) dir.create(output_dir, recursive = TRUE)

# load the colour palette from the JSON file
LULC_pal <- fromJSON(file.path(map_dir, "LULC_pal.json"))

# list files with .tif extension in the map dir
map_files <- list.files(map_dir, pattern = "\\.tif$", full.names = TRUE)

# remove the first file
map_files <- map_files[-1]

# create a vector between 2020 and 2060 with 5 year intervals
sim_years <- seq(2020, 2060, by = 5)
names(map_files) <- sim_years

# create vector of names of scenarios
scenarios <- c("bau", "nat", "cul", "soc")

# loop over the sequence saving PNGs and JSON files for each year
for(year in names(map_files)) {

  cat(paste0("Processing year: ", year, "\n"))

  # load the raster file
  lulc_raster <- rast(map_files[year])

  # Create a named vector for color mapping
  col_map <- setNames(LULC_pal$colour, LULC_pal$class_value)

  # loop over scenarios to save a map for each
  for(scenario in scenarios){

    # define output PNG path
    output_png <- file.path(output_dir, paste0("lulc-", scenario, "-" ,year, ".png"))

    # save the indexed PNG
    save_indexed_png(raster_obj = lulc_raster,
                   output_path = output_png,
                   color_palette = col_map,
                   width = 25,
                   height = 20,
                   resolution = 300,
                   units = "cm",
                   margins = c(0, 0, 0, 0),
                   background = "transparent",
                   colorspace = "sRGB",
                   max_colors = 256,
                   show_legend = FALSE,
                   axes = FALSE,
                   box = FALSE,
                   cleanup_temp = TRUE,
                   verbose = TRUE)

    cat(paste0("Saved indexed PNG to: ", output_png, "\n"))

    # get frequency table of the masked raster layer
    rast_tbl <- freq(lulc_raster)
    rast_tbl$layer <- NULL
    rast_tbl$class_name <- sapply(rast_tbl$value, function(x) LULC_pal$class_name[which(LULC_pal$class_value == x)])

    # sort the table by increasing values
    rast_tbl <- rast_tbl[order(rast_tbl$value),]

    # make sure the class_name is a factor with levels in the current order
    rast_tbl$class_name <- factor(rast_tbl$class_name, levels = rast_tbl$class_name)

    rast_tbl$value <- NULL
    rast_tbl$perc_area <- rast_tbl$count / sum(rast_tbl$count) * 100
    rast_tbl$count <- NULL

    # convert the df to json
    json_data <- toJSON(setNames(as.list(rast_tbl$class_name), rast_tbl$perc_area), pretty = TRUE)

    output_json <- file.path(output_dir, paste0("lulc-", scenario, "-" ,year, ".json"))

    # save the json data to the mask_path_data
    write(json_data, file = output_json)
    }
}

# Now we need to produce maps of change between the first and last time points
# load the json files for 2020 and 2060
lulc_2020_area <- fromJSON(file.path(output_dir, "lulc-bau-2020.json"), simplifyDataFrame = TRUE)

# convert to df with names as a column called perc_area and values as a column called class_name
lulc_2020_area <- data.frame(class_name = unlist(lulc_2020_area), perc_area = as.numeric(names(lulc_2020_area)), stringsAsFactors = FALSE, row.names = NULL)

lulc_2060_area <- fromJSON(file.path(output_dir, "lulc-bau-2060.json"), simplifyDataFrame = TRUE)
lulc_2060_area <- data.frame(class_name = unlist(lulc_2060_area), perc_area = as.numeric(names(lulc_2060_area)), stringsAsFactors = FALSE, row.names = NULL)

# calculate the difference in % area for each class as a % of the area at the start
area_change <- merge(lulc_2020_area, lulc_2060_area, by = "class_name", suffixes = c("_start", "_end"))
area_change$perc_area_change <- ((area_change$perc_area_end - area_change$perc_area_start)/area_change$perc_area_start)*100

# sort area_change using the order of the LULC_rat$lulc_name
area_change <- area_change[order(match(area_change$class_name, lulc_2020_area$class_name)), ]

# make sure the class_name is a factor with levels in the current order
area_change$class_name <- factor(area_change$class_name, levels = area_change$class_name)

# convert the df to json
area_change_json <- toJSON(setNames(as.list(area_change$class_name), area_change$perc_area_change), pretty = TRUE)

for(scenario in scenarios){

  output_json <- file.path(output_dir, paste0("lulc-", scenario, "-change.json"))

  # save the json data to the mask_path_data
  write(area_change_json, file = output_json)
}


# load the 2020 and 2060 rasters
lulc_2020 <- rast(map_files["2020"])
lulc_2060 <- rast(map_files["2060"])

# set 0 to NA in both layers
lulc_2020[lulc_2020 == 0] <- NA
lulc_2060[lulc_2060 == 0] <- NA

# save over both the rasters
writeRaster(lulc_2020, file.path(output_dir, "lulc-2020.tif"), overwrite=TRUE)
writeRaster(lulc_2060, file.path(output_dir, "lulc-2060.tif"), overwrite=TRUE)

# load the rasters again to be sure
lulc_2020 <- rast(file.path(output_dir, "lulc-2020.tif"))
lulc_2060 <- rast(file.path(output_dir, "lulc-2060.tif"))

# loop over the unique class_values
for(class in LULC_pal$class_value){}
class = LULC_pal$class_value[1]

  cat(paste0("Processing class: ", LULC_pal$class_name[LULC_pal$class_value == class], "\n"))

  # Apply the rules
  change_map <- ifel(
    lulc_2020 == lulc_2060,
    0,  # persistence
    ifel(
      lulc_2060 == class & lulc_2020 != class,
      2,  # gain
      ifel(
        lulc_2020 == class & lulc_2060 != class,
        1,  # loss
        NA  # other changes can be NA
      )
    )
  )

  # Write to disk (very important for large rasters)
  change_rast_path <- file.path(output_dir, paste0("lulc-", LULC_pal$class_name[LULC_pal$class_value == class], "-change.tif"))
  writeRaster(change_map, change_rast_path, overwrite=TRUE)

  # create firefly map
  change_map <- create_firefly_change_map(change_rast)

  # replace any whitespaces in the class with '_'
  clean_class <- gsub

  for(scenario in scenarios){

    # create path
    change_map_path <- file.path(output_dir, paste0(scenario, "-", clean_class, "-change.png"))

    # save
    ggsave(change_map,
           change_map_path,
           width = 25,
           height = 20,
           resolution = 300,
           units = "cm",)
  }




