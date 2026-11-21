-- Run in the isolated staging SQL Editor. Database size includes indexes and internal tables.
with usage as (select pg_database_size(current_database()) as bytes)
select bytes, pg_size_pretty(bytes) as database_size,
       round(100.0*bytes/500000000,2) as percent_of_free_database,
       case when bytes>=400000000 then 'review usage' else 'within threshold' end as status
from usage;
