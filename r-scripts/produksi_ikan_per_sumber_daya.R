library(Hmisc)
library(doBy)
library(gdata)
library(ggplot2)
library(ggpmisc)
library(ggmap)
library(RPostgreSQL)
library(memisc)
library(gmodels)
library(plyr)
library(dplyr)
library(RcppEigen)
library(lme4)
library(bootstrap)
library(fishmethods)
library(TropFishR)
library(stargazer)
library(data.table)
library(fishmethods)
library(kableExtra)
library(scales)
library(viridis)

options(echo = TRUE)

roundUpNice <- function(x, nice = c(1, 2, 4, 5, 6, 8, 10)) {
  if (length(x) != 1) stop("'x' must be of length 1")
  10^floor(log10(x)) * nice[[which(x <= 10^floor(log10(x)) * nice)[[1]]]]
}

param <- commandArgs(trailingOnly = TRUE)

#koneksi ke DB
con <- DBI::dbConnect(
  drv = RPostgres::Postgres(),
  dbname = "e_brpl_2",
  host = "localhost",
  port = "5432",
  user = "postgres",
  password = "talasbogor"
)
on.exit(dbDisconnect(drv))

file_name <- param[1]
sampling_date_query <- param[2]
wpp_query <- param[3]
resource_query <- param[4]
location_query <- param[5]

sql_query <- paste("
  select uuid_sumber_daya,
       round(cast(total_tangkapan_volume as numeric), 2) as total_tangkapan_volume,
       extract(month from tanggal_pendaratan)               bulan,
       uuid_alat_tangkap
  from brpl_pendaratan
         inner join brpl_rincianpendaratan on brpl_pendaratan.uuid = brpl_rincianpendaratan.uuid_pendaratan
         where",
                   sampling_date_query, wpp_query, resource_query, location_query
  , "and total_tangkapan_volume > 0
")

q_produksi <- dbSendQuery(con, sql_query)

produksi <- dbFetch(q_produksi, n = -1)
produksi$total_tangkapan_volume <- produksi$total_tangkapan_volume / 1000

df_sumberdaya <- ddply(produksi, .(uuid_sumber_daya, bulan), summarise, Produksi = sum(total_tangkapan_volume))
colnames(df_sumberdaya) <- c("Sumber Daya", "Bulan", "Produksi (Ton)")
df_sumberdaya$Bulan <- month.abb[df_sumberdaya$Bulan]
df_sumberdaya$Bulan <- factor(df_sumberdaya$Bulan, levels = month.abb)

maxy <- max(df_sumberdaya$`Produksi (Ton)`)
maxy <- roundUpNice(maxy)

fig_produksi <-
  ggplot(df_sumberdaya, aes(x = `Bulan`, y = `Produksi (Ton)`, fill = `Sumber Daya`)) +
    geom_bar(stat = 'identity', position = position_dodge()) +
    scale_y_continuous(limits = c(0, maxy), expand = c(0, 0)) +
    scale_fill_brewer(palette = "Set2") +
    theme_classic()


jpeg(paste0("r-scripts/images/", file_name, '.jpg'))
fig_produksi
dev.off()

dbClearResult(q_produksi)
