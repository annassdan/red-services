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

roundUpNice <- function(x, nice=c(1,2,4,5,6,8,10)) {
  if(length(x) != 1) stop("'x' must be of length 1")
  10^floor(log10(x)) * nice[[which(x <= 10^floor(log10(x)) * nice)[[1]]]]
}

param <- commandArgs(trailingOnly = TRUE)

file_name <- param[1]
sampling_date_query <- param[2]
wpp_query <- param[3]
resource_query <- param[4]
location_query <- param[5]
db_name <- param[6]
db_host <- param[7]
db_port <- param[8]
db_user <- param[9]
db_password <- param[10]

#koneksi ke DB
con <- DBI::dbConnect(
  drv = RPostgres::Postgres(),
  dbname = db_name,
  host = db_host,
  port = db_port,
  user = db_user,
  password = db_password
)
on.exit(dbDisconnect(drv))

# Building query selector
sql_query <- paste("
  with source as (select round(cast(total_tangkapan_volume as numeric), 2) as produksi,
                       extract(month from tanggal_pendaratan)                bulan,
                       brpl_pendaratan.uuid                                    as trip
                from brpl_pendaratan
                         INNER JOIN brpl_rincianpendaratan
                                    ON brpl_pendaratan.uuid = brpl_rincianpendaratan.uuid_pendaratan
                where",
                   sampling_date_query, wpp_query, resource_query, location_query
  , ")
  select produksi, bulan, count(trip) as trip
  from source
  group by bulan, produksi
")

q_trip <- dbSendQuery(con, sql_query)

trip <- dbFetch(q_trip, n = -1)
trip$produksi <- trip$produksi / 1000

df_trip <- ddply(trip, .(bulan), summarise, Produksi = sum(produksi), Trip = sum(trip))
colnames(df_trip) <- c("Bulan", "Produksi (Ton)", "Trip")
df_trip$Bulan <- month.abb[df_trip$Bulan]
df_trip$Bulan <- factor(df_trip$Bulan, levels = month.abb)
df_trip$`Produksi (Ton)` <- as.numeric(df_trip$`Produksi (Ton)`)
df_trip$Trip <- as.numeric(df_trip$Trip)
maxy <- max(df_trip$`Produksi (Ton)`)
maxy <- roundUpNice(maxy)
maxtrip <- max(df_trip$Trip)
max <- max(df_trip$`Produksi (Ton)`) / max(df_trip$Trip)

fig_trip <-
  ggplot(df_trip, aes(x = `Bulan`)) +
    geom_bar(aes(y = `Produksi (Ton)`), stat = 'identity', position = position_dodge(), fill = "springgreen3") +
    geom_line(aes(y = `Trip` * max, group = 1), linetype = "solid", size = 2, color = "orangered") +
    geom_point(aes(y = `Trip` * max), color = 'darkred', size = 3) +
    scale_y_continuous(limits = c(0, maxy), expand = c(0, 0), sec.axis = sec_axis(~. / max, name = "Jumlah Trip")) +
    #ggtitle(paste0("Hasil Tangkapan per Trip di ", lokasi," Tahun", tahun, ".")) +
    theme_classic()
#theme(plot.title = element_text(color="black", size=14, face="bold", hjust = 0.5))

jpeg(paste0("r-scripts/images/", file_name, '.jpg'))
fig_trip
dev.off()

dbClearResult(q_trip)
